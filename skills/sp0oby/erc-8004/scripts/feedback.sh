#!/bin/bash
# ERC-8004: Give feedback/reputation to an agent
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

usage() {
    cat <<EOF
Usage: $(basename "$0") --agent-id ID --score SCORE [OPTIONS]

Give reputation feedback to an agent.

Options:
    -a, --agent-id ID   Agent ID to rate (required)
    -s, --score SCORE   Score value (required, can be negative)
    -d, --decimals N    Value decimals [default: 0]
    --tag1 TAG          Primary tag (e.g., "quality", "uptime")
    --tag2 TAG          Secondary tag
    --endpoint URL      Endpoint being rated
    --uri URI           Feedback details URI (IPFS)
    -n, --network NET   Network [default: sepolia]
    -k, --key KEY       Private key
    --dry-run           Simulate only
    -h, --help          Show this help

Examples:
    $(basename "$0") --agent-id 1 --score 85 --tag1 "quality"
    $(basename "$0") --agent-id 1 --score 9977 --decimals 2 --tag1 "uptime"
    $(basename "$0") --agent-id 1 --score -32 --decimals 1 --tag1 "tradingYield"
EOF
    exit 0
}

AGENT_ID=""
SCORE=""
DECIMALS=0
TAG1=""
TAG2=""
ENDPOINT=""
FEEDBACK_URI=""
NETWORK="sepolia"
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -a|--agent-id) AGENT_ID="$2"; shift 2 ;;
        -s|--score) SCORE="$2"; shift 2 ;;
        -d|--decimals) DECIMALS="$2"; shift 2 ;;
        --tag1) TAG1="$2"; shift 2 ;;
        --tag2) TAG2="$2"; shift 2 ;;
        --endpoint) ENDPOINT="$2"; shift 2 ;;
        --uri) FEEDBACK_URI="$2"; shift 2 ;;
        -n|--network) NETWORK="$2"; shift 2 ;;
        -k|--key) PRIVATE_KEY="$2"; shift 2 ;;
        --dry-run) DRY_RUN=true; shift ;;
        -h|--help) usage ;;
        *) echo "Unknown option: $1"; usage ;;
    esac
done

[[ -z "$AGENT_ID" ]] && { echo "❌ --agent-id required"; usage; }
[[ -z "$SCORE" ]] && { echo "❌ --score required"; usage; }

load_network "$NETWORK"

# Verify agent exists
EXISTS=$(cast call "$IDENTITY_REGISTRY" "agentExists(uint256)" "$AGENT_ID" --rpc-url "$RPC_URL")
if [[ "$EXISTS" == "0x0000000000000000000000000000000000000000000000000000000000000000" ]]; then
    echo "❌ Agent $AGENT_ID does not exist"
    exit 1
fi

# Cannot rate your own agent
OWNER=$(cast call "$IDENTITY_REGISTRY" "ownerOf(uint256)" "$AGENT_ID" --rpc-url "$RPC_URL")
OWNER_ADDR="0x$(echo "$OWNER" | cut -c27-66)"
if [[ "${OWNER_ADDR,,}" == "${WALLET_ADDRESS,,}" ]]; then
    echo "❌ Cannot give feedback to your own agent"
    exit 1
fi

echo "⭐ Giving feedback to agent $AGENT_ID"
echo "   Score: $SCORE (decimals: $DECIMALS)"
[[ -n "$TAG1" ]] && echo "   Tag1: $TAG1"
[[ -n "$TAG2" ]] && echo "   Tag2: $TAG2"
[[ -n "$ENDPOINT" ]] && echo "   Endpoint: $ENDPOINT"

# feedbackHash: bytes32(0) for now
FEEDBACK_HASH="0x0000000000000000000000000000000000000000000000000000000000000000"

if $DRY_RUN; then
    echo "🔍 Dry run - simulating..."
    cast call "$REPUTATION_REGISTRY" \
        "giveFeedback(uint256,int128,uint8,string,string,string,string,bytes32)" \
        "$AGENT_ID" "$SCORE" "$DECIMALS" "$TAG1" "$TAG2" "$ENDPOINT" "$FEEDBACK_URI" "$FEEDBACK_HASH" \
        --rpc-url "$RPC_URL"
    echo "✅ Simulation successful"
    exit 0
fi

echo "📝 Sending transaction..."
TX_HASH=$(cast send "$REPUTATION_REGISTRY" \
    "giveFeedback(uint256,int128,uint8,string,string,string,string,bytes32)" \
    "$AGENT_ID" "$SCORE" "$DECIMALS" "$TAG1" "$TAG2" "$ENDPOINT" "$FEEDBACK_URI" "$FEEDBACK_HASH" \
    --private-key "$PRIVATE_KEY" \
    --rpc-url "$RPC_URL" \
    --json | jq -r '.transactionHash')

echo "⏳ Waiting for confirmation..."
RECEIPT=$(cast receipt "$TX_HASH" --rpc-url "$RPC_URL" --json)
STATUS=$(echo "$RECEIPT" | jq -r '.status')

if [[ "$STATUS" == "0x1" ]]; then
    echo ""
    echo "✅ Feedback submitted!"
    echo "   TX: $EXPLORER_URL/tx/$TX_HASH"
else
    echo "❌ Transaction failed"
    echo "   TX: $EXPLORER_URL/tx/$TX_HASH"
    exit 1
fi
