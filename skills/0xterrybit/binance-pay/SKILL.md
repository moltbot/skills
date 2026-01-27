---
name: binance-pay
description: Binance Pay integration for crypto payments. Send, receive, and accept cryptocurrency payments with the world's largest exchange.
metadata: {"clawdbot":{"emoji":"🟡","requires":{"bins":["curl","jq"],"env":["BINANCE_PAY_API_KEY","BINANCE_PAY_SECRET"]}}}
---

# Binance Pay 🟡

Crypto payment solution powered by Binance, the world's largest cryptocurrency exchange.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `BINANCE_PAY_API_KEY` | Merchant API Key | Yes |
| `BINANCE_PAY_SECRET` | API Secret Key | Yes |
| `BINANCE_PAY_MERCHANT_ID` | Merchant ID | Yes |

## Features

- 💸 **C2C Transfers** - Send crypto to Binance users (0 fee)
- 🛒 **Merchant Payments** - Accept crypto payments
- 🔄 **Refunds** - Process payment refunds
- 📊 **Order Management** - Track payment status
- 🌍 **200M+ Users** - Access to Binance ecosystem

## API Base URL

```
https://bpay.binanceapi.com
```

## Authentication

```bash
API_KEY="${BINANCE_PAY_API_KEY}"
SECRET="${BINANCE_PAY_SECRET}"
TIMESTAMP=$(date +%s%3N)
NONCE=$(openssl rand -hex 16)

# Generate signature
generate_signature() {
  local payload="$1"
  local sign_string="${TIMESTAMP}\n${NONCE}\n${payload}\n"
  echo -n "$sign_string" | openssl dgst -sha512 -hmac "$SECRET" | cut -d' ' -f2 | tr '[:lower:]' '[:upper:]'
}
```

## Create Payment Order

```bash
PAYLOAD='{
  "env": {
    "terminalType": "WEB"
  },
  "merchantTradeNo": "'"$(date +%s)"'",
  "orderAmount": "10.00",
  "currency": "USDT",
  "goods": {
    "goodsType": "01",
    "goodsCategory": "D000",
    "referenceGoodsId": "product-001",
    "goodsName": "Product Name"
  }
}'

SIGNATURE=$(generate_signature "$PAYLOAD")

curl -s -X POST "https://bpay.binanceapi.com/binancepay/openapi/v2/order" \
  -H "Content-Type: application/json" \
  -H "BinancePay-Timestamp: ${TIMESTAMP}" \
  -H "BinancePay-Nonce: ${NONCE}" \
  -H "BinancePay-Certificate-SN: ${API_KEY}" \
  -H "BinancePay-Signature: ${SIGNATURE}" \
  -d "$PAYLOAD" | jq '.'
```

## Query Order Status

```bash
PAYLOAD='{
  "merchantTradeNo": "<ORDER_ID>"
}'

SIGNATURE=$(generate_signature "$PAYLOAD")

curl -s -X POST "https://bpay.binanceapi.com/binancepay/openapi/v2/order/query" \
  -H "Content-Type: application/json" \
  -H "BinancePay-Timestamp: ${TIMESTAMP}" \
  -H "BinancePay-Nonce: ${NONCE}" \
  -H "BinancePay-Certificate-SN: ${API_KEY}" \
  -H "BinancePay-Signature: ${SIGNATURE}" \
  -d "$PAYLOAD" | jq '.'
```

## Close Order

```bash
PAYLOAD='{
  "merchantTradeNo": "<ORDER_ID>"
}'

SIGNATURE=$(generate_signature "$PAYLOAD")

curl -s -X POST "https://bpay.binanceapi.com/binancepay/openapi/v2/order/close" \
  -H "Content-Type: application/json" \
  -H "BinancePay-Timestamp: ${TIMESTAMP}" \
  -H "BinancePay-Nonce: ${NONCE}" \
  -H "BinancePay-Certificate-SN: ${API_KEY}" \
  -H "BinancePay-Signature: ${SIGNATURE}" \
  -d "$PAYLOAD" | jq '.'
```

## Process Refund

```bash
PAYLOAD='{
  "refundRequestId": "'"$(date +%s)"'",
  "prepayId": "<PREPAY_ID>",
  "refundAmount": "5.00"
}'

SIGNATURE=$(generate_signature "$PAYLOAD")

curl -s -X POST "https://bpay.binanceapi.com/binancepay/openapi/v2/order/refund" \
  -H "Content-Type: application/json" \
  -H "BinancePay-Timestamp: ${TIMESTAMP}" \
  -H "BinancePay-Nonce: ${NONCE}" \
  -H "BinancePay-Certificate-SN: ${API_KEY}" \
  -H "BinancePay-Signature: ${SIGNATURE}" \
  -d "$PAYLOAD" | jq '.'
```

## Supported Currencies

| Currency | Type | Min Amount |
|----------|------|------------|
| USDT | Stablecoin | 0.01 |
| BUSD | Stablecoin | 0.01 |
| USDC | Stablecoin | 0.01 |
| BTC | Crypto | 0.00001 |
| ETH | Crypto | 0.0001 |
| BNB | Crypto | 0.001 |

## Webhook Events

| Event | Description |
|-------|-------------|
| `PAY` | Payment completed |
| `REFUND` | Refund processed |
| `CANCEL` | Order cancelled |

## Webhook Verification

```bash
# Verify webhook signature
verify_webhook() {
  local payload="$1"
  local received_sig="$2"
  local timestamp="$3"
  local nonce="$4"
  
  local sign_string="${timestamp}\n${nonce}\n${payload}\n"
  local expected_sig=$(echo -n "$sign_string" | openssl dgst -sha512 -hmac "$SECRET" | cut -d' ' -f2 | tr '[:lower:]' '[:upper:]')
  
  [[ "$received_sig" == "$expected_sig" ]]
}
```

## Order Status Codes

| Status | Description |
|--------|-------------|
| `INITIAL` | Order created |
| `PENDING` | Awaiting payment |
| `PAID` | Payment successful |
| `CANCELED` | Order cancelled |
| `REFUNDING` | Refund in progress |
| `REFUNDED` | Refund completed |
| `EXPIRED` | Order expired |

## Safety Rules

1. **ALWAYS** verify webhook signatures
2. **NEVER** expose API secrets
3. **ALWAYS** use idempotent merchantTradeNo
4. **CHECK** order status before fulfilling

## Links

- [Binance Pay Docs](https://developers.binance.com/docs/binance-pay)
- [Merchant Portal](https://merchant.binance.com/)
- [API Reference](https://developers.binance.com/docs/binance-pay/api-order-create-v2)
