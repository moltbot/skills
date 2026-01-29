---
name: mpc-accept-crypto-payments
description: Accept crypto payments on Solana via MoonPay Commerce (formerly Helio). Create Pay Links, generate checkout URLs, check transactions, and list supported currencies. Use when the user wants to accept crypto payments, create payment links, charge for products/services with crypto, or query payment transactions. Requires a MoonPay Commerce account with API key and secret.
---

# MPC Accept Crypto Payments

Merchant-side skill for accepting crypto payments on Solana via MoonPay Commerce (formerly Helio).

## Setup

Run the setup script with your API credentials (wallet ID is fetched automatically):

```bash
bash scripts/setup.sh
```

You'll need:
- **API Key** — from https://app.hel.io → Settings → API Keys
- **API Secret** — from the same page (save it when generated)

The setup script will:
1. Validate your credentials against the API
2. Fetch your Solana wallets automatically
3. Select the PAYOUT wallet (or CONNECTED if no PAYOUT exists)
4. Save everything to `~/.mpc/helio/config`

If the user doesn't have an account, direct them to https://app.hel.io to sign up.

### Config Management
```bash
bash scripts/setup.sh status   # Show current config
bash scripts/setup.sh clear    # Remove saved credentials
```

## Quick Reference

Base URL: `https://api.hel.io/v1`

### List Supported Currencies (no auth needed)
```bash
curl -s https://api.hel.io/v1/currency | jq '.[].symbol'
```

### Create a Pay Link
```bash
curl -s -X POST "https://api.hel.io/v1/paylink/create/api-key?apiKey=$HELIO_API_KEY" \
  -H "Authorization: Bearer $HELIO_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Payment",
    "template": "OTHER",
    "pricingCurrency": "<CURRENCY_ID>",
    "price": "<AMOUNT_IN_BASE_UNITS>",
    "features": {
      "canChangePrice": false,
      "canChangeQuantity": false,
      "canSwapTokens": true
    },
    "recipients": [{
      "currencyId": "<CURRENCY_ID>",
      "walletId": "<YOUR_WALLET_ID>"
    }]
  }'
```

**Defaults:** Currency is USDC (`6340313846e4f91b8abc519b`). Token swapping is enabled so payers can pay with any supported Solana token (auto-converted to USDC).

**Price format:** `price` is in base units (int64 string). For USDC (6 decimals): `"1000000"` = 1 USDC. For SOL (9 decimals): `"1000000000"` = 1 SOL.

### Create a Charge (Checkout URL)
```bash
curl -s -X POST "https://api.hel.io/v1/charge/api-key?apiKey=$HELIO_API_KEY" \
  -H "Authorization: Bearer $HELIO_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"paymentRequestId": "<PAYLINK_ID>"}'
```
Returns `{ "id": "...", "pageUrl": "https://..." }` — share `pageUrl` with the payer.

### Check Transactions
```bash
curl -s "https://api.hel.io/v1/paylink/<PAYLINK_ID>/transactions?apiKey=$HELIO_API_KEY" \
  -H "Authorization: Bearer $HELIO_API_SECRET"
```

### Disable / Enable a Pay Link
```bash
curl -s -X PATCH "https://api.hel.io/v1/paylink/<PAYLINK_ID>/disable?apiKey=$HELIO_API_KEY&disabled=true" \
  -H "Authorization: Bearer $HELIO_API_SECRET"
```

## Helper Script

```bash
# Setup (run first)
bash scripts/setup.sh

# Operations
bash scripts/helio.sh currencies
bash scripts/helio.sh create-paylink "Coffee" 5.00 USDC
bash scripts/helio.sh charge <paylink-id>
bash scripts/helio.sh transactions <paylink-id>
bash scripts/helio.sh disable <paylink-id>
bash scripts/helio.sh enable <paylink-id>
```

## Templates

The `template` field controls Pay Link type:
- `OTHER` — generic payment
- `PRODUCT` — physical/digital product
- `INVOICE` — invoice
- `SUBSCRIPTION` — recurring (requires `subscriptionDetails`)
- `EVENT` — event ticket

## Credential Handling

When setting up credentials, run the setup script interactively:
```bash
bash scripts/setup.sh
```

The script prompts for credentials directly in the terminal — they are never stored in chat history or logs. Credentials are saved to `~/.mpc/helio/config` (mode 600).

## Advanced

- Full API schema details: see `references/api-reference.md`
- OpenAPI spec: https://api.hel.io/v1/docs-json
- Dashboard: https://app.hel.io
- Docs: https://docs.hel.io
