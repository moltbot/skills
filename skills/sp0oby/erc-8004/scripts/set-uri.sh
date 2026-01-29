#!/bin/bash
# ERC-8004: Set/update agent URI
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

usage() {
    cat <<EOF
Usage: $(basename "$0") --agent-id ID --uri URI [OPTIONS]

Set or update the registration URI for an agent.

Options:
    -a, --agent-id ID   Agent ID to update (required)
    -u, --uri URI       New URI (IPFS/HTTPS/data:) (required)
    -n, --network NET   Network (sepolia) [default: sepolia]
    -k, --key KEY       Private key (or set PRIVATE_KEY env)
    --dry-run           Simulate without sending transaction
    -h, --help          Show this help

Examples:
    $(basename "$0") --agent-id 1 --uri "ipfs://QmXyz..."
    $(basename "$0") -a 1 -u "https://example.com/agent.json"
EOF
    exit 0
}

AGENT_ID=""
URI=""
NETWORK="sepolia"
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -a|--agent-id) AGENT_ID="$2"; shift 2 ;;
        -u|--uri) URI="$2"; shift 2 ;;
        -n|--network) NETWORK="$2"; shift 2 ;;
        -k|--key) PRIVATE_KEY="$2"; shift 2 ;;
        --dry-run) DRY_RUN=true; shift ;;
        -h|--help) usage ;;
        *) echo "Unknown option: $1"; usage ;;
    esac
done

[[ -z "$AGENT_ID" ]] && { echo "❌ --agent-id required"; usage; }
[[ -z "$URI" ]] && { echo "❌ --uri required"; usage; }

load_network "$NETWORK"

echo "🔄 Updating agent URI"
echo "   Agent ID: $AGENT_ID"
echo "   New URI: $URI"
echo "   Network: $NETWORK"

# Verify ownership
OWNER=$(cast call "$IDENTITY_REGISTRY" "ownerOf(uint256)" "$AGENT_ID" --rpc-url "$RPC_URL")
OWNER_ADDR="0x$(echo "$OWNER" | cut -c27-66)"

if [[ "${OWNER_ADDR,,}" != "${WALLET_ADDRESS,,}" ]]; then
    echo "❌ Not owner of agent $AGENT_ID"
    echo "   Owner: $OWNER_ADDR"
    echo "   Your wallet: $WALLET_ADDRESS"
    exit 1
fi

if $DRY_RUN; then
    echo "🔍 Dry run - simulating..."
    cast call "$IDENTITY_REGISTRY" "setAgentURI(uint256,string)" "$AGENT_ID" "$URI" --rpc-url "$RPC_URL"
    echo "✅ Simulation successful"
    exit 0
fi

echo "📝 Sending transaction..."
TX_HASH=$(cast send "$IDENTITY_REGISTRY" "setAgentURI(uint256,string)" "$AGENT_ID" "$URI" \
    --private-key "$PRIVATE_KEY" \
    --rpc-url "$RPC_URL" \
    --json | jq -r '.transactionHash')

echo "⏳ Waiting for confirmation..."
RECEIPT=$(cast receipt "$TX_HASH" --rpc-url "$RPC_URL" --json)
STATUS=$(echo "$RECEIPT" | jq -r '.status')

if [[ "$STATUS" == "0x1" ]]; then
    echo ""
    echo "✅ URI updated successfully!"
    echo "   TX: $EXPLORER_URL/tx/$TX_HASH"
else
    echo "❌ Transaction failed"
    echo "   TX: $EXPLORER_URL/tx/$TX_HASH"
    exit 1
fi
