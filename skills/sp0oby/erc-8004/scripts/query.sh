#!/bin/bash
# ERC-8004: Query agents and reputation
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

usage() {
    cat <<EOF
Usage: $(basename "$0") <command> [OPTIONS]

Query ERC-8004 registries.

Commands:
    agent <id>          Get agent info by ID
    total               Get total registered agents
    reputation <id>     Get reputation summary for agent
    search <term>       Search agents (requires indexer)

Options:
    -n, --network NET   Network (sepolia) [default: sepolia]
    -h, --help          Show this help

Examples:
    $(basename "$0") agent 1
    $(basename "$0") total
    $(basename "$0") reputation 1
EOF
    exit 0
}

NETWORK="sepolia"

# Parse network flag if present
while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--network) NETWORK="$2"; shift 2 ;;
        -h|--help) usage ;;
        *) break ;;
    esac
done

[[ $# -lt 1 ]] && usage

COMMAND="$1"
shift

load_network "$NETWORK"

case "$COMMAND" in
    agent)
        [[ $# -lt 1 ]] && { echo "Usage: query.sh agent <id>"; exit 1; }
        AGENT_ID="$1"
        
        echo "🔍 Querying agent $AGENT_ID on $NETWORK..."
        echo ""
        
        EXISTS=$(cast call "$IDENTITY_REGISTRY" "agentExists(uint256)" "$AGENT_ID" --rpc-url "$RPC_URL")
        if [[ "$EXISTS" == "0x0000000000000000000000000000000000000000000000000000000000000000" ]]; then
            echo "❌ Agent $AGENT_ID does not exist"
            exit 1
        fi
        
        OWNER=$(cast call "$IDENTITY_REGISTRY" "ownerOf(uint256)" "$AGENT_ID" --rpc-url "$RPC_URL")
        OWNER_ADDR=$(echo "$OWNER" | cut -c27-66)
        
        URI_RAW=$(cast call "$IDENTITY_REGISTRY" "tokenURI(uint256)" "$AGENT_ID" --rpc-url "$RPC_URL" 2>/dev/null || echo "")
        
        WALLET=$(cast call "$IDENTITY_REGISTRY" "getAgentWallet(uint256)" "$AGENT_ID" --rpc-url "$RPC_URL")
        WALLET_ADDR=$(echo "$WALLET" | cut -c27-66)
        
        echo "📋 Agent #$AGENT_ID"
        echo "   Owner:  0x$OWNER_ADDR"
        echo "   Wallet: 0x$WALLET_ADDR"
        if [[ -n "$URI_RAW" && "$URI_RAW" != "0x" ]]; then
            # Decode the URI (it's ABI encoded string)
            URI=$(cast --to-ascii "$URI_RAW" 2>/dev/null | tr -d '\0' || echo "[encoded]")
            echo "   URI:    $URI"
        else
            echo "   URI:    (not set)"
        fi
        echo ""
        echo "🔗 Explorer: $EXPLORER_URL/token/$IDENTITY_REGISTRY?a=$AGENT_ID"
        ;;
        
    total)
        echo "🔍 Querying total agents on $NETWORK..."
        TOTAL=$(cast call "$IDENTITY_REGISTRY" "totalAgents()" --rpc-url "$RPC_URL" | cast --to-dec)
        echo ""
        echo "📊 Total registered agents: $TOTAL"
        echo "🔗 Registry: $EXPLORER_URL/address/$IDENTITY_REGISTRY"
        ;;
        
    reputation)
        [[ $# -lt 1 ]] && { echo "Usage: query.sh reputation <agent_id>"; exit 1; }
        AGENT_ID="$1"
        
        echo "🔍 Querying reputation for agent $AGENT_ID..."
        echo ""
        
        # Get summary with empty filters
        SUMMARY=$(cast call "$REPUTATION_REGISTRY" \
            "getSummary(uint256,address[],string,string)" \
            "$AGENT_ID" "[]" "" "" \
            --rpc-url "$RPC_URL" 2>/dev/null || echo "error")
        
        if [[ "$SUMMARY" == "error" ]]; then
            echo "⚠️ No reputation data or query failed"
        else
            echo "📊 Reputation Summary:"
            echo "   Raw: $SUMMARY"
            # Parse: (uint64 count, int128 summaryValue, uint8 summaryValueDecimals)
        fi
        ;;
        
    search)
        echo "⚠️ Search requires an indexer (The Graph subgraph)"
        echo "   For now, iterate through agent IDs manually"
        ;;
        
    *)
        echo "Unknown command: $COMMAND"
        usage
        ;;
esac
