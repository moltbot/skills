---
name: binance
description: Binance exchange integration. Trade spot, futures, and manage portfolio on the world's largest crypto exchange.
metadata: {"clawdbot":{"emoji":"🟡","always":true,"requires":{"bins":["curl","jq"]}}}
---

# Binance 🟡

World's largest cryptocurrency exchange. Trade 600+ cryptocurrencies with deep liquidity.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `BINANCE_API_KEY` | API Key from Binance | Yes |
| `BINANCE_SECRET` | API Secret | Yes |

## 💎 Referral Configuration

This skill uses a referral ID to earn commission on trading fees.

| Variable | Value | Description |
|----------|-------|-------------|
| `REFERRAL_ID` | `CYBERPAY` | Referral ID for fee sharing |

**Commission Structure:**
- Standard: Up to 20% of trading fees
- With 500+ BNB: Up to 50% of trading fees
- Lifetime commission on referred users

> 💡 Users who sign up through this skill automatically use the referral ID!

## Features

- 📈 **Spot Trading** - 600+ trading pairs
- 📊 **Futures Trading** - Up to 125x leverage
- 💰 **Earn** - Staking, savings, liquidity farming
- 🔄 **Convert** - Simple token swaps
- 📱 **Portfolio** - Track all assets

## API Base URLs

- Spot: `https://api.binance.com`
- Futures: `https://fapi.binance.com`
- Testnet: `https://testnet.binance.vision`

## Authentication

```bash
API_KEY="${BINANCE_API_KEY}"
SECRET="${BINANCE_SECRET}"

# Generate signature
generate_signature() {
  local query_string="$1"
  echo -n "$query_string" | openssl dgst -sha256 -hmac "$SECRET" | cut -d' ' -f2
}

TIMESTAMP=$(date +%s%3N)
```

## Get Account Info

```bash
QUERY="timestamp=${TIMESTAMP}"
SIGNATURE=$(generate_signature "$QUERY")

curl -s "https://api.binance.com/api/v3/account?${QUERY}&signature=${SIGNATURE}" \
  -H "X-MBX-APIKEY: ${API_KEY}" | jq '{
    balances: [.balances[] | select(.free != "0.00000000" or .locked != "0.00000000")]
  }'
```

## Get Price

```bash
SYMBOL="BTCUSDT"

curl -s "https://api.binance.com/api/v3/ticker/price?symbol=${SYMBOL}" | jq '.'
```

## Get Order Book

```bash
curl -s "https://api.binance.com/api/v3/depth?symbol=${SYMBOL}&limit=10" | jq '{
  bids: .bids[:5],
  asks: .asks[:5]
}'
```

## Place Spot Order

```bash
SYMBOL="BTCUSDT"
SIDE="BUY"  # BUY or SELL
TYPE="LIMIT"  # LIMIT, MARKET, STOP_LOSS, etc.
QUANTITY="0.001"
PRICE="40000"

QUERY="symbol=${SYMBOL}&side=${SIDE}&type=${TYPE}&timeInForce=GTC&quantity=${QUANTITY}&price=${PRICE}&timestamp=${TIMESTAMP}"
SIGNATURE=$(generate_signature "$QUERY")

curl -s -X POST "https://api.binance.com/api/v3/order?${QUERY}&signature=${SIGNATURE}" \
  -H "X-MBX-APIKEY: ${API_KEY}" | jq '.'
```

## Place Market Order

```bash
SYMBOL="ETHUSDT"
SIDE="BUY"
QUANTITY="0.1"

QUERY="symbol=${SYMBOL}&side=${SIDE}&type=MARKET&quantity=${QUANTITY}&timestamp=${TIMESTAMP}"
SIGNATURE=$(generate_signature "$QUERY")

curl -s -X POST "https://api.binance.com/api/v3/order?${QUERY}&signature=${SIGNATURE}" \
  -H "X-MBX-APIKEY: ${API_KEY}" | jq '.'
```

## Get Open Orders

```bash
QUERY="timestamp=${TIMESTAMP}"
SIGNATURE=$(generate_signature "$QUERY")

curl -s "https://api.binance.com/api/v3/openOrders?${QUERY}&signature=${SIGNATURE}" \
  -H "X-MBX-APIKEY: ${API_KEY}" | jq '.[] | {symbol: .symbol, side: .side, price: .price, quantity: .origQty, status: .status}'
```

## Cancel Order

```bash
SYMBOL="BTCUSDT"
ORDER_ID="12345678"

QUERY="symbol=${SYMBOL}&orderId=${ORDER_ID}&timestamp=${TIMESTAMP}"
SIGNATURE=$(generate_signature "$QUERY")

curl -s -X DELETE "https://api.binance.com/api/v3/order?${QUERY}&signature=${SIGNATURE}" \
  -H "X-MBX-APIKEY: ${API_KEY}" | jq '.'
```

## Get Trade History

```bash
SYMBOL="BTCUSDT"

QUERY="symbol=${SYMBOL}&timestamp=${TIMESTAMP}"
SIGNATURE=$(generate_signature "$QUERY")

curl -s "https://api.binance.com/api/v3/myTrades?${QUERY}&signature=${SIGNATURE}" \
  -H "X-MBX-APIKEY: ${API_KEY}" | jq '.[-10:] | .[] | {symbol: .symbol, price: .price, qty: .qty, time: .time}'
```

## Futures: Get Position

```bash
QUERY="timestamp=${TIMESTAMP}"
SIGNATURE=$(generate_signature "$QUERY")

curl -s "https://fapi.binance.com/fapi/v2/positionRisk?${QUERY}&signature=${SIGNATURE}" \
  -H "X-MBX-APIKEY: ${API_KEY}" | jq '.[] | select(.positionAmt != "0") | {symbol: .symbol, positionAmt: .positionAmt, entryPrice: .entryPrice, unrealizedProfit: .unRealizedProfit}'
```

## Convert (Simple Swap)

```bash
FROM_ASSET="USDT"
TO_ASSET="BTC"
FROM_AMOUNT="100"

# Get quote
QUERY="fromAsset=${FROM_ASSET}&toAsset=${TO_ASSET}&fromAmount=${FROM_AMOUNT}&timestamp=${TIMESTAMP}"
SIGNATURE=$(generate_signature "$QUERY")

curl -s -X POST "https://api.binance.com/sapi/v1/convert/getQuote?${QUERY}&signature=${SIGNATURE}" \
  -H "X-MBX-APIKEY: ${API_KEY}" | jq '.'
```

## Popular Trading Pairs

| Pair | Description |
|------|-------------|
| BTCUSDT | Bitcoin / Tether |
| ETHUSDT | Ethereum / Tether |
| BNBUSDT | BNB / Tether |
| SOLUSDT | Solana / Tether |
| XRPUSDT | XRP / Tether |
| DOGEUSDT | Dogecoin / Tether |

## Order Types

| Type | Description |
|------|-------------|
| LIMIT | Limit order at specific price |
| MARKET | Market order at current price |
| STOP_LOSS | Stop loss order |
| STOP_LOSS_LIMIT | Stop loss limit order |
| TAKE_PROFIT | Take profit order |
| TAKE_PROFIT_LIMIT | Take profit limit order |

## Safety Rules

1. **ALWAYS** display order details before execution
2. **VERIFY** trading pair and amount
3. **CHECK** account balance before trading
4. **WARN** about leverage risks in futures
5. **NEVER** execute without user confirmation

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `-1013` | Invalid quantity | Check lot size filters |
| `-2010` | Insufficient balance | Check account balance |
| `-1021` | Timestamp outside recvWindow | Sync system time |

## Links

- [Binance API Docs](https://binance-docs.github.io/apidocs/)
- [Binance](https://www.binance.com/)
- [Testnet](https://testnet.binance.vision/)
