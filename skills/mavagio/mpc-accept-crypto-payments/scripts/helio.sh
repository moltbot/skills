#!/usr/bin/env bash
# helio.sh — MoonPay Commerce (Helio) CLI helper
# Usage: bash helio.sh <command> [args...]
#
# Commands:
#   currencies                         List Solana currencies
#   currency-id <SYMBOL>               Get currency ID by symbol (e.g. USDC, SOL)
#   create-paylink <name> <amount> <symbol>  Create a Pay Link
#   charge <paylink-id>                Create checkout URL
#   transactions <paylink-id>          List transactions
#   disable <paylink-id>               Disable a Pay Link
#   enable <paylink-id>                Re-enable a Pay Link

set -euo pipefail

command -v jq &>/dev/null || { echo "❌ jq required. Install: brew install jq (macOS) or apt install jq (Linux)"; exit 1; }

BASE="https://api.hel.io/v1"
CONFIG_FILE="$HOME/.mpc/helio/config"

# Auto-load config if exists
if [[ -f "$CONFIG_FILE" ]]; then
  source "$CONFIG_FILE"
fi

# Check credentials
check_auth() {
  if [[ -z "${HELIO_API_KEY:-}" || -z "${HELIO_API_SECRET:-}" ]]; then
    echo "ERROR: Helio not configured. Run setup first:" >&2
    echo "  bash scripts/setup.sh" >&2
    exit 1
  fi
}

check_wallet() {
  if [[ -z "${HELIO_WALLET_ID:-}" ]]; then
    echo "ERROR: Wallet ID not configured. Run setup first:" >&2
    echo "  bash scripts/setup.sh" >&2
    exit 1
  fi
}

# Auth headers
auth_headers() {
  echo -H "Authorization: Bearer $HELIO_API_SECRET"
}

cmd="${1:-help}"
shift || true

case "$cmd" in
  currencies)
    echo "Fetching Solana currencies..."
    curl -s "$BASE/currency" | jq -r '.[] | select(.blockchain.symbol == "SOL") | "\(.symbol)\t\(.id)\tdecimals=\(.decimals)"' | sort
    ;;

  currency-id)
    symbol="${1:?Usage: helio.sh currency-id <SYMBOL>}"
    curl -s "$BASE/currency" | jq -r --arg s "$symbol" '.[] | select(.symbol == $s and .blockchain.symbol == "SOL") | .id'
    ;;

  create-paylink)
    name="${1:?Usage: helio.sh create-paylink <name> <amount> <symbol>}"
    amount="${2:?Missing amount}"
    symbol="${3:-USDC}"
    check_auth
    check_wallet

    # Look up currency
    echo "Looking up currency $symbol..."
    currency_info=$(curl -s "$BASE/currency" | jq -r --arg s "$symbol" '[.[] | select(.symbol == $s and .blockchain.symbol == "SOL")][0]')

    if [[ "$currency_info" == "null" || -z "$currency_info" ]]; then
      echo "ERROR: Currency $symbol not found on Solana" >&2
      exit 1
    fi

    currency_id=$(echo "$currency_info" | jq -r '.id')
    decimals=$(echo "$currency_info" | jq -r '.decimals')

    # Convert human-readable amount to base units
    price=$(awk "BEGIN {printf \"%.0f\", $amount * (10 ^ $decimals)}")

    echo "Creating Pay Link: $name — $amount $symbol ($price base units, currency=$currency_id, swap=on)"

    result=$(curl -s -X POST "$BASE/paylink/create/api-key?apiKey=$HELIO_API_KEY" \
      -H "Authorization: Bearer $HELIO_API_SECRET" \
      -H "Content-Type: application/json" \
      -d "$(jq -n \
        --arg name "$name" \
        --arg price "$price" \
        --arg currId "$currency_id" \
        --arg walletId "$HELIO_WALLET_ID" \
        '{
          name: $name,
          template: "OTHER",
          pricingCurrency: $currId,
          price: $price,
          features: {
            canChangePrice: false,
            canChangeQuantity: false,
            canSwapTokens: true
          },
          recipients: [{
            currencyId: $currId,
            walletId: $walletId
          }]
        }'
      )")

    echo "$result" | jq .

    # Extract paylink ID if present
    plid=$(echo "$result" | jq -r '.id // empty')
    if [[ -n "$plid" ]]; then
      echo ""
      echo "Pay Link ID: $plid"
      echo "Checkout:    https://app.hel.io/pay/$plid"
    fi
    ;;

  charge)
    paylink_id="${1:?Usage: helio.sh charge <paylink-id>}"
    check_auth

    echo "Creating charge for paylink $paylink_id..."
    result=$(curl -s -X POST "$BASE/charge/api-key?apiKey=$HELIO_API_KEY" \
      -H "Authorization: Bearer $HELIO_API_SECRET" \
      -H "Content-Type: application/json" \
      -d "$(jq -n --arg id "$paylink_id" '{paymentRequestId: $id}')")

    echo "$result" | jq .

    url=$(echo "$result" | jq -r '.pageUrl // empty')
    if [[ -n "$url" ]]; then
      echo ""
      echo "Checkout URL: $url"
    fi
    ;;

  transactions)
    paylink_id="${1:?Usage: helio.sh transactions <paylink-id>}"
    check_auth

    echo "Fetching transactions for paylink $paylink_id..."
    curl -s "$BASE/paylink/$paylink_id/transactions?apiKey=$HELIO_API_KEY" \
      -H "Authorization: Bearer $HELIO_API_SECRET" | jq .
    ;;

  disable)
    paylink_id="${1:?Usage: helio.sh disable <paylink-id>}"
    check_auth

    echo "Disabling paylink $paylink_id..."
    curl -s -X PATCH "$BASE/paylink/$paylink_id/disable?apiKey=$HELIO_API_KEY&disabled=true" \
      -H "Authorization: Bearer $HELIO_API_SECRET"
    echo "Done."
    ;;

  enable)
    paylink_id="${1:?Usage: helio.sh enable <paylink-id>}"
    check_auth

    echo "Enabling paylink $paylink_id..."
    curl -s -X PATCH "$BASE/paylink/$paylink_id/disable?apiKey=$HELIO_API_KEY&disabled=false" \
      -H "Authorization: Bearer $HELIO_API_SECRET"
    echo "Done."
    ;;

  help|*)
    cat <<'EOF'
helio.sh — MoonPay Commerce (Helio) CLI helper

Commands:
  currencies                             List Solana currencies (no auth needed)
  currency-id <SYMBOL>                   Get currency ID for a symbol
  create-paylink <name> <amount> <symbol>  Create a Pay Link
  charge <paylink-id>                    Create a checkout URL for payers
  transactions <paylink-id>              List transactions for a Pay Link
  disable <paylink-id>                   Disable a Pay Link
  enable <paylink-id>                    Re-enable a Pay Link

Setup:
  bash scripts/setup.sh                  Configure API key + secret (auto-fetches wallet ID)
  bash scripts/setup.sh status           Show current config
  bash scripts/setup.sh clear            Remove saved credentials

Config is loaded from: ~/.mpc/helio/config
Get API credentials at: https://app.hel.io → Settings → API Keys
EOF
    ;;
esac
