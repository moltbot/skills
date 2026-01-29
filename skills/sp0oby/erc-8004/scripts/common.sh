#!/bin/bash
# ERC-8004 Common utilities
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTRACTS_FILE="$SCRIPT_DIR/../lib/contracts.json"

# Load network configuration
load_network() {
    local network="${1:-sepolia}"
    
    if ! command -v jq &>/dev/null; then
        echo "❌ jq required. Install: brew install jq"
        exit 1
    fi
    
    if ! command -v cast &>/dev/null; then
        echo "❌ cast (foundry) required. Install: curl -L https://foundry.paradigm.xyz | bash"
        exit 1
    fi
    
    export NETWORK="$network"
    export CHAIN_ID=$(jq -r ".networks.$network.chainId" "$CONTRACTS_FILE")
    export RPC_URL=$(jq -r ".networks.$network.rpc" "$CONTRACTS_FILE")
    export EXPLORER_URL=$(jq -r ".networks.$network.explorer" "$CONTRACTS_FILE")
    export IDENTITY_REGISTRY=$(jq -r ".networks.$network.contracts.identityRegistry" "$CONTRACTS_FILE")
    export REPUTATION_REGISTRY=$(jq -r ".networks.$network.contracts.reputationRegistry" "$CONTRACTS_FILE")
    export VALIDATION_REGISTRY=$(jq -r ".networks.$network.contracts.validationRegistry" "$CONTRACTS_FILE")
    
    if [[ "$CHAIN_ID" == "null" ]]; then
        echo "❌ Unknown network: $network"
        echo "   Available: $(jq -r '.networks | keys | join(", ")' "$CONTRACTS_FILE")"
        exit 1
    fi
    
    # Load private key
    if [[ -z "${PRIVATE_KEY:-}" ]]; then
        local pk_file="$HOME/.clawdbot/wallets/.deployer_pk"
        if [[ -f "$pk_file" ]]; then
            export PRIVATE_KEY=$(cat "$pk_file")
        else
            echo "❌ No private key. Set PRIVATE_KEY env or use --key"
            exit 1
        fi
    fi
    
    # Derive wallet address
    export WALLET_ADDRESS=$(cast wallet address "$PRIVATE_KEY")
}

# Fetch agent info
get_agent() {
    local agent_id="$1"
    local rpc="${RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}"
    local registry="${IDENTITY_REGISTRY:-0xf66e7CBdAE1Cb710fee7732E4e1f173624e137A7}"
    
    local exists=$(cast call "$registry" "agentExists(uint256)" "$agent_id" --rpc-url "$rpc")
    if [[ "$exists" == "0x0000000000000000000000000000000000000000000000000000000000000000" ]]; then
        echo "Agent $agent_id does not exist"
        return 1
    fi
    
    local owner=$(cast call "$registry" "ownerOf(uint256)" "$agent_id" --rpc-url "$rpc")
    local uri=$(cast call "$registry" "tokenURI(uint256)" "$agent_id" --rpc-url "$rpc" | cast --to-ascii 2>/dev/null || echo "")
    local wallet=$(cast call "$registry" "getAgentWallet(uint256)" "$agent_id" --rpc-url "$rpc")
    
    echo "Agent ID: $agent_id"
    echo "Owner: $owner"
    echo "URI: $uri"
    echo "Wallet: $wallet"
}

# Upload JSON to IPFS via Pinata or web3.storage
upload_ipfs() {
    local file="$1"
    
    if [[ -n "${PINATA_JWT:-}" ]]; then
        local response=$(curl -s -X POST "https://api.pinata.cloud/pinning/pinFileToIPFS" \
            -H "Authorization: Bearer $PINATA_JWT" \
            -F "file=@$file")
        echo "ipfs://$(echo "$response" | jq -r '.IpfsHash')"
    else
        echo "❌ Set PINATA_JWT env for IPFS upload"
        echo "   Or manually upload to: https://app.pinata.cloud/"
        return 1
    fi
}
