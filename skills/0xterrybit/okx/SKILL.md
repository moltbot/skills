---
name: okx
description: OKX exchange integration. Trade spot, futures, options, and DeFi on one of the world's largest crypto exchanges.
metadata: {"clawdbot":{"emoji":"⚫","always":true,"requires":{"bins":["curl","jq"]}}}
---

# OKX ⚫

Top 5 global cryptocurrency exchange. Trade 300+ cryptocurrencies with advanced features.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OKX_API_KEY` | API Key from OKX | Yes |
| `OKX_SECRET` | API Secret | Yes |
| `OKX_PASSPHRASE` | API Passphrase | Yes |

## 💎 Referral Configuration

This skill uses a referral code to earn commission on trading fees.

| Variable | Value | Description |
|----------|-------|-------------|
| `REFERRAL_CODE` | `CYBERPAY` | Referral code for fee sharing |

**Commission Structure:**
- Up to 50% of trading fees in USDT
- Mystery Box rewards for new users
- Lifetime commission on referred users

> 💡 Users who sign up through this skill automatically use the referral code!

## Features

- 📈 **Spot Trading** - 300+ trading pairs
- 📊 **Futures & Perpetuals** - Up to 125x leverage
- 🎯 **Options Trading** - BTC/ETH options
- 💰 **Earn** - Staking, savings, DeFi
- 🔄 **Convert** - Simple token swaps
- 🌐 **Web3 Wallet** - Built-in DeFi access

## API Base URL

```
https://www.okx.com
```

## Authentication

```bash
API_KEY="${OKX_API_KEY}"
SECRET="${OKX_SECRET}"
PASSPHRASE="${OKX_PASSPHRASE}"

# Generate signature
generate_signature() {
  local timestamp="$1"
  local method="$2"
  local path="$3"
  local body="$4"
  local sign_string="${timestamp}${method}${path}${body}"
  echo -n "$sign_string" | openssl dgst -sha256 -hmac "$SECRET" -binary | base64
}

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
```

## Get Account Balance

```bash
METHOD="GET"
PATH="/api/v5/account/balance"
SIGNATURE=$(generate_signature "$TIMESTAMP" "$METHOD" "$PATH" "")

curl -s "https://www.okx.com${PATH}" \
  -H "OK-ACCESS-KEY: ${API_KEY}" \
  -H "OK-ACCESS-SIGN: ${SIGNATURE}" \
  -H "OK-ACCESS-TIMESTAMP: ${TIMESTAMP}" \
  -H "OK-ACCESS-PASSPHRASE: ${PASSPHRASE}" | jq '.data[0].details[] | select(.cashBal != "0") | {ccy: .ccy, cashBal: .cashBal, availBal: .availBal}'
```

## Get Ticker Price

```bash
INST_ID="BTC-USDT"

curl -s "https://www.okx.com/api/v5/market/ticker?instId=${INST_ID}" | jq '.data[0] | {instId: .instId, last: .last, high24h: .high24h, low24h: .low24h, vol24h: .vol24h}'
```

## Get Order Book

```bash
curl -s "https://www.okx.com/api/v5/market/books?instId=${INST_ID}&sz=10" | jq '{
  asks: .data[0].asks[:5],
  bids: .data[0].bids[:5]
}'
```

## Place Spot Order

```bash
METHOD="POST"
PATH="/api/v5/trade/order"
BODY='{
  "instId": "BTC-USDT",
  "tdMode": "cash",
  "side": "buy",
  "ordType": "limit",
  "px": "40000",
  "sz": "0.001"
}'
SIGNATURE=$(generate_signature "$TIMESTAMP" "$METHOD" "$PATH" "$BODY")

curl -s -X POST "https://www.okx.com${PATH}" \
  -H "Content-Type: application/json" \
  -H "OK-ACCESS-KEY: ${API_KEY}" \
  -H "OK-ACCESS-SIGN: ${SIGNATURE}" \
  -H "OK-ACCESS-TIMESTAMP: ${TIMESTAMP}" \
  -H "OK-ACCESS-PASSPHRASE: ${PASSPHRASE}" \
  -d "$BODY" | jq '.'
```

## Place Market Order

```bash
BODY='{
  "instId": "ETH-USDT",
  "tdMode": "cash",
  "side": "buy",
  "ordType": "market",
  "sz": "0.1"
}'
SIGNATURE=$(generate_signature "$TIMESTAMP" "$METHOD" "$PATH" "$BODY")

curl -s -X POST "https://www.okx.com${PATH}" \
  -H "Content-Type: application/json" \
  -H "OK-ACCESS-KEY: ${API_KEY}" \
  -H "OK-ACCESS-SIGN: ${SIGNATURE}" \
  -H "OK-ACCESS-TIMESTAMP: ${TIMESTAMP}" \
  -H "OK-ACCESS-PASSPHRASE: ${PASSPHRASE}" \
  -d "$BODY" | jq '.'
```

## Get Open Orders

```bash
METHOD="GET"
PATH="/api/v5/trade/orders-pending"
SIGNATURE=$(generate_signature "$TIMESTAMP" "$METHOD" "$PATH" "")

curl -s "https://www.okx.com${PATH}" \
  -H "OK-ACCESS-KEY: ${API_KEY}" \
  -H "OK-ACCESS-SIGN: ${SIGNATURE}" \
  -H "OK-ACCESS-TIMESTAMP: ${TIMESTAMP}" \
  -H "OK-ACCESS-PASSPHRASE: ${PASSPHRASE}" | jq '.data[] | {instId: .instId, side: .side, px: .px, sz: .sz, state: .state}'
```

## Cancel Order

```bash
METHOD="POST"
PATH="/api/v5/trade/cancel-order"
BODY='{
  "instId": "BTC-USDT",
  "ordId": "12345678"
}'
SIGNATURE=$(generate_signature "$TIMESTAMP" "$METHOD" "$PATH" "$BODY")

curl -s -X POST "https://www.okx.com${PATH}" \
  -H "Content-Type: application/json" \
  -H "OK-ACCESS-KEY: ${API_KEY}" \
  -H "OK-ACCESS-SIGN: ${SIGNATURE}" \
  -H "OK-ACCESS-TIMESTAMP: ${TIMESTAMP}" \
  -H "OK-ACCESS-PASSPHRASE: ${PASSPHRASE}" \
  -d "$BODY" | jq '.'
```

## Get Trade History

```bash
METHOD="GET"
PATH="/api/v5/trade/fills?instType=SPOT"
SIGNATURE=$(generate_signature "$TIMESTAMP" "$METHOD" "$PATH" "")

curl -s "https://www.okx.com${PATH}" \
  -H "OK-ACCESS-KEY: ${API_KEY}" \
  -H "OK-ACCESS-SIGN: ${SIGNATURE}" \
  -H "OK-ACCESS-TIMESTAMP: ${TIMESTAMP}" \
  -H "OK-ACCESS-PASSPHRASE: ${PASSPHRASE}" | jq '.data[:10] | .[] | {instId: .instId, side: .side, fillPx: .fillPx, fillSz: .fillSz}'
```

## Convert (Simple Swap)

```bash
# Get quote
METHOD="POST"
PATH="/api/v5/asset/convert/estimate-quote"
BODY='{
  "baseCcy": "BTC",
  "quoteCcy": "USDT",
  "side": "buy",
  "rfqSz": "100",
  "rfqSzCcy": "USDT"
}'
SIGNATURE=$(generate_signature "$TIMESTAMP" "$METHOD" "$PATH" "$BODY")

curl -s -X POST "https://www.okx.com${PATH}" \
  -H "Content-Type: application/json" \
  -H "OK-ACCESS-KEY: ${API_KEY}" \
  -H "OK-ACCESS-SIGN: ${SIGNATURE}" \
  -H "OK-ACCESS-TIMESTAMP: ${TIMESTAMP}" \
  -H "OK-ACCESS-PASSPHRASE: ${PASSPHRASE}" \
  -d "$BODY" | jq '.'
```

## Popular Trading Pairs

| Pair | Description |
|------|-------------|
| BTC-USDT | Bitcoin / Tether |
| ETH-USDT | Ethereum / Tether |
| SOL-USDT | Solana / Tether |
| XRP-USDT | XRP / Tether |
| OKB-USDT | OKB / Tether |

## Order Types

| Type | Description |
|------|-------------|
| limit | Limit order |
| market | Market order |
| post_only | Post-only order |
| fok | Fill or kill |
| ioc | Immediate or cancel |

## Safety Rules

1. **ALWAYS** display order details before execution
2. **VERIFY** trading pair and amount
3. **CHECK** account balance before trading
4. **WARN** about leverage risks
5. **NEVER** execute without user confirmation

## Error Handling

| Code | Cause | Solution |
|------|-------|----------|
| 51000 | Parameter error | Check parameters |
| 51008 | Insufficient balance | Check balance |
| 51009 | Order not exist | Check order ID |

## Links

- [OKX API Docs](https://www.okx.com/docs-v5/)
- [OKX](https://www.okx.com/)
- [Demo Trading](https://www.okx.com/demo-trading)
