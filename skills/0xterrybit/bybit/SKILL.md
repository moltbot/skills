---
name: bybit
description: Bybit exchange integration. Trade spot, derivatives, and perpetuals with up to 100x leverage.
metadata: {"clawdbot":{"emoji":"🔶","always":true,"requires":{"bins":["curl","jq"]}}}
---

# Bybit 🔶

Leading derivatives exchange. Trade spot, perpetuals, and options with deep liquidity.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `BYBIT_API_KEY` | API Key from Bybit | Yes |
| `BYBIT_SECRET` | API Secret | Yes |

## 💎 Referral Configuration

This skill uses a referral code to earn commission on trading fees.

| Variable | Value | Description |
|----------|-------|-------------|
| `REFERRAL_CODE` | `CYBERPAY` | Referral code for fee sharing |

**Commission Structure:**
- Up to 50% of trading fees (Spot, Futures, Options)
- Bonus rewards for new users
- Lifetime commission on referred users

> 💡 Users who sign up through this skill automatically use the referral code!

## Features

- 📈 **Spot Trading** - 500+ trading pairs
- 📊 **Perpetuals** - Up to 100x leverage
- 🎯 **Options** - BTC/ETH options
- 💰 **Earn** - Staking, savings
- 🤖 **Copy Trading** - Follow top traders
- 🎮 **Trading Bots** - Grid, DCA, Martingale

## API Base URL

```
https://api.bybit.com
```

## Authentication

```bash
API_KEY="${BYBIT_API_KEY}"
SECRET="${BYBIT_SECRET}"

# Generate signature
generate_signature() {
  local timestamp="$1"
  local params="$2"
  local sign_string="${timestamp}${API_KEY}5000${params}"
  echo -n "$sign_string" | openssl dgst -sha256 -hmac "$SECRET" | cut -d' ' -f2
}

TIMESTAMP=$(date +%s%3N)
```

## Get Account Balance

```bash
PARAMS=""
SIGNATURE=$(generate_signature "$TIMESTAMP" "$PARAMS")

curl -s "https://api.bybit.com/v5/account/wallet-balance?accountType=UNIFIED" \
  -H "X-BAPI-API-KEY: ${API_KEY}" \
  -H "X-BAPI-SIGN: ${SIGNATURE}" \
  -H "X-BAPI-TIMESTAMP: ${TIMESTAMP}" \
  -H "X-BAPI-RECV-WINDOW: 5000" | jq '.result.list[0].coin[] | select(.walletBalance != "0") | {coin: .coin, walletBalance: .walletBalance, availableToWithdraw: .availableToWithdraw}'
```

## Get Ticker Price

```bash
SYMBOL="BTCUSDT"
CATEGORY="spot"  # spot, linear, inverse, option

curl -s "https://api.bybit.com/v5/market/tickers?category=${CATEGORY}&symbol=${SYMBOL}" | jq '.result.list[0] | {symbol: .symbol, lastPrice: .lastPrice, highPrice24h: .highPrice24h, lowPrice24h: .lowPrice24h, volume24h: .volume24h}'
```

## Get Order Book

```bash
curl -s "https://api.bybit.com/v5/market/orderbook?category=${CATEGORY}&symbol=${SYMBOL}&limit=10" | jq '{
  asks: .result.a[:5],
  bids: .result.b[:5]
}'
```

## Place Spot Order

```bash
PARAMS='{"category":"spot","symbol":"BTCUSDT","side":"Buy","orderType":"Limit","qty":"0.001","price":"40000"}'
SIGNATURE=$(generate_signature "$TIMESTAMP" "$PARAMS")

curl -s -X POST "https://api.bybit.com/v5/order/create" \
  -H "Content-Type: application/json" \
  -H "X-BAPI-API-KEY: ${API_KEY}" \
  -H "X-BAPI-SIGN: ${SIGNATURE}" \
  -H "X-BAPI-TIMESTAMP: ${TIMESTAMP}" \
  -H "X-BAPI-RECV-WINDOW: 5000" \
  -d "$PARAMS" | jq '.'
```

## Place Market Order

```bash
PARAMS='{"category":"spot","symbol":"ETHUSDT","side":"Buy","orderType":"Market","qty":"0.1"}'
SIGNATURE=$(generate_signature "$TIMESTAMP" "$PARAMS")

curl -s -X POST "https://api.bybit.com/v5/order/create" \
  -H "Content-Type: application/json" \
  -H "X-BAPI-API-KEY: ${API_KEY}" \
  -H "X-BAPI-SIGN: ${SIGNATURE}" \
  -H "X-BAPI-TIMESTAMP: ${TIMESTAMP}" \
  -H "X-BAPI-RECV-WINDOW: 5000" \
  -d "$PARAMS" | jq '.'
```

## Place Perpetual Order

```bash
PARAMS='{"category":"linear","symbol":"BTCUSDT","side":"Buy","orderType":"Limit","qty":"0.01","price":"40000","timeInForce":"GTC"}'
SIGNATURE=$(generate_signature "$TIMESTAMP" "$PARAMS")

curl -s -X POST "https://api.bybit.com/v5/order/create" \
  -H "Content-Type: application/json" \
  -H "X-BAPI-API-KEY: ${API_KEY}" \
  -H "X-BAPI-SIGN: ${SIGNATURE}" \
  -H "X-BAPI-TIMESTAMP: ${TIMESTAMP}" \
  -H "X-BAPI-RECV-WINDOW: 5000" \
  -d "$PARAMS" | jq '.'
```

## Get Open Orders

```bash
PARAMS="category=spot"
SIGNATURE=$(generate_signature "$TIMESTAMP" "$PARAMS")

curl -s "https://api.bybit.com/v5/order/realtime?${PARAMS}" \
  -H "X-BAPI-API-KEY: ${API_KEY}" \
  -H "X-BAPI-SIGN: ${SIGNATURE}" \
  -H "X-BAPI-TIMESTAMP: ${TIMESTAMP}" \
  -H "X-BAPI-RECV-WINDOW: 5000" | jq '.result.list[] | {symbol: .symbol, side: .side, price: .price, qty: .qty, orderStatus: .orderStatus}'
```

## Cancel Order

```bash
PARAMS='{"category":"spot","symbol":"BTCUSDT","orderId":"12345678"}'
SIGNATURE=$(generate_signature "$TIMESTAMP" "$PARAMS")

curl -s -X POST "https://api.bybit.com/v5/order/cancel" \
  -H "Content-Type: application/json" \
  -H "X-BAPI-API-KEY: ${API_KEY}" \
  -H "X-BAPI-SIGN: ${SIGNATURE}" \
  -H "X-BAPI-TIMESTAMP: ${TIMESTAMP}" \
  -H "X-BAPI-RECV-WINDOW: 5000" \
  -d "$PARAMS" | jq '.'
```

## Get Position (Perpetuals)

```bash
PARAMS="category=linear&settleCoin=USDT"
SIGNATURE=$(generate_signature "$TIMESTAMP" "$PARAMS")

curl -s "https://api.bybit.com/v5/position/list?${PARAMS}" \
  -H "X-BAPI-API-KEY: ${API_KEY}" \
  -H "X-BAPI-SIGN: ${SIGNATURE}" \
  -H "X-BAPI-TIMESTAMP: ${TIMESTAMP}" \
  -H "X-BAPI-RECV-WINDOW: 5000" | jq '.result.list[] | select(.size != "0") | {symbol: .symbol, side: .side, size: .size, avgPrice: .avgPrice, unrealisedPnl: .unrealisedPnl}'
```

## Get Trade History

```bash
PARAMS="category=spot"
SIGNATURE=$(generate_signature "$TIMESTAMP" "$PARAMS")

curl -s "https://api.bybit.com/v5/execution/list?${PARAMS}" \
  -H "X-BAPI-API-KEY: ${API_KEY}" \
  -H "X-BAPI-SIGN: ${SIGNATURE}" \
  -H "X-BAPI-TIMESTAMP: ${TIMESTAMP}" \
  -H "X-BAPI-RECV-WINDOW: 5000" | jq '.result.list[:10] | .[] | {symbol: .symbol, side: .side, execPrice: .execPrice, execQty: .execQty}'
```

## Popular Trading Pairs

| Pair | Description |
|------|-------------|
| BTCUSDT | Bitcoin / Tether |
| ETHUSDT | Ethereum / Tether |
| SOLUSDT | Solana / Tether |
| XRPUSDT | XRP / Tether |
| DOGEUSDT | Dogecoin / Tether |

## Order Types

| Type | Description |
|------|-------------|
| Limit | Limit order |
| Market | Market order |
| PostOnly | Post-only order |

## Categories

| Category | Description |
|----------|-------------|
| spot | Spot trading |
| linear | USDT perpetuals |
| inverse | Coin-margined perpetuals |
| option | Options |

## Safety Rules

1. **ALWAYS** display order details before execution
2. **VERIFY** trading pair and amount
3. **CHECK** account balance before trading
4. **WARN** about leverage risks
5. **NEVER** execute without user confirmation

## Error Handling

| Code | Cause | Solution |
|------|-------|----------|
| 10001 | Parameter error | Check parameters |
| 10003 | Invalid API key | Check API key |
| 110007 | Insufficient balance | Check balance |

## Links

- [Bybit API Docs](https://bybit-exchange.github.io/docs/)
- [Bybit](https://www.bybit.com/)
- [Testnet](https://testnet.bybit.com/)
