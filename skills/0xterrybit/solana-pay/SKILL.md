---
name: solana-pay
description: Solana Pay protocol integration. Generate payment requests, QR codes, and verify transactions on Solana blockchain.
metadata: {"clawdbot":{"emoji":"⚡","requires":{"bins":["solana","curl","jq","qrencode"],"env":["SOLANA_KEYPAIR_PATH"]}}}
---

# Solana Pay ⚡

Decentralized payment protocol built on Solana. Instant, near-zero fee payments.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SOLANA_KEYPAIR_PATH` | Path to merchant wallet keypair | Yes |
| `SOLANA_RPC_URL` | Custom RPC endpoint | No |
| `MERCHANT_NAME` | Display name for payments | No |

## Features

- 💸 **Instant Payments** - Sub-second finality (~400ms)
- 🆓 **Near-Zero Fees** - ~$0.00025 per transaction
- 🔗 **QR Code Payments** - Generate scannable payment requests
- 🛒 **Point of Sale** - Merchant integrations
- 📱 **Wallet Support** - Phantom, Solflare, Backpack

## Payment URL Specification

Solana Pay uses a URL scheme for payment requests:

```
solana:<recipient>?amount=<amount>&spl-token=<mint>&reference=<reference>&label=<label>&message=<message>&memo=<memo>
```

## Generate Payment Request (SOL)

```bash
RECIPIENT=$(solana address --keypair "$SOLANA_KEYPAIR_PATH")
AMOUNT="1.5"
REFERENCE=$(solana-keygen new --no-bip39-passphrase --silent --outfile /dev/stdout | head -1)
LABEL="My Store"
MESSAGE="Order #12345"

# Build Solana Pay URL
PAY_URL="solana:${RECIPIENT}?amount=${AMOUNT}&reference=${REFERENCE}&label=${LABEL}&message=${MESSAGE}"

echo "Payment URL: $PAY_URL"

# Generate QR code (requires qrencode)
echo "$PAY_URL" | qrencode -o payment_qr.png -s 10
echo "QR code saved to payment_qr.png"
```

## Generate Payment Request (SPL Token)

```bash
RECIPIENT=$(solana address --keypair "$SOLANA_KEYPAIR_PATH")
AMOUNT="100"
SPL_TOKEN="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"  # USDC
REFERENCE=$(openssl rand -hex 32)
LABEL="My Store"
MESSAGE="Order #12345"

# Build Solana Pay URL with SPL token
PAY_URL="solana:${RECIPIENT}?amount=${AMOUNT}&spl-token=${SPL_TOKEN}&reference=${REFERENCE}&label=${LABEL}&message=${MESSAGE}"

echo "Payment URL: $PAY_URL"
echo "$PAY_URL" | qrencode -o payment_qr.png -s 10
```

## Common Token Addresses

| Token | Mint Address |
|-------|--------------|
| USDC | EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v |
| USDT | Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB |
| BONK | DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263 |
| JUP | JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN |

## Verify Payment by Reference

```bash
REFERENCE="<REFERENCE_PUBKEY>"
RPC_URL="${SOLANA_RPC_URL:-https://api.mainnet-beta.solana.com}"

# Find transaction with reference
curl -s -X POST "$RPC_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 1,
    \"method\": \"getSignaturesForAddress\",
    \"params\": [\"${REFERENCE}\", {\"limit\": 1}]
  }" | jq '.result[0]'
```

## Validate Transaction

```bash
SIGNATURE="<TX_SIGNATURE>"
EXPECTED_RECIPIENT="<MERCHANT_WALLET>"
EXPECTED_AMOUNT="1000000"  # in lamports or token units

# Get transaction details
TX=$(curl -s -X POST "$RPC_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 1,
    \"method\": \"getTransaction\",
    \"params\": [\"${SIGNATURE}\", {\"encoding\": \"jsonParsed\", \"maxSupportedTransactionVersion\": 0}]
  }")

# Verify recipient and amount
echo "$TX" | jq '.result.transaction.message.instructions[] | select(.parsed.type == "transfer")'
```

## Transaction Request (Interactive Payments)

For complex payments requiring server interaction:

```bash
# Server endpoint that returns transaction
TRANSACTION_URL="https://your-server.com/api/pay"

# Solana Pay URL pointing to transaction endpoint
PAY_URL="solana:${TRANSACTION_URL}"
```

### Transaction Request Server Example

```javascript
// POST /api/pay
// Returns serialized transaction for wallet to sign

app.post('/api/pay', async (req, res) => {
  const { account } = req.body;  // Payer's wallet
  
  // Build transaction
  const transaction = new Transaction();
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: new PublicKey(account),
      toPubkey: MERCHANT_WALLET,
      lamports: LAMPORTS_PER_SOL * 0.1
    })
  );
  
  // Serialize and return
  const serialized = transaction.serialize({
    requireAllSignatures: false,
    verifySignatures: false
  });
  
  res.json({
    transaction: serialized.toString('base64'),
    message: 'Payment for Order #123'
  });
});
```

## Point of Sale Integration

### Generate Dynamic QR

```bash
#!/bin/bash
# pos_payment.sh - Generate payment QR for POS

AMOUNT="$1"
ORDER_ID="$2"
TOKEN="${3:-SOL}"

RECIPIENT=$(solana address --keypair "$SOLANA_KEYPAIR_PATH")
REFERENCE=$(openssl rand -hex 32)

if [[ "$TOKEN" == "SOL" ]]; then
  PAY_URL="solana:${RECIPIENT}?amount=${AMOUNT}&reference=${REFERENCE}&memo=Order-${ORDER_ID}"
else
  # Get token mint
  case "$TOKEN" in
    USDC) MINT="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" ;;
    USDT) MINT="Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB" ;;
  esac
  PAY_URL="solana:${RECIPIENT}?amount=${AMOUNT}&spl-token=${MINT}&reference=${REFERENCE}&memo=Order-${ORDER_ID}"
fi

# Display QR in terminal (requires qrencode)
echo "$PAY_URL" | qrencode -t ANSIUTF8

# Save reference for verification
echo "$REFERENCE" > "/tmp/order_${ORDER_ID}_ref.txt"
echo "Reference saved. Waiting for payment..."
```

### Poll for Payment

```bash
#!/bin/bash
# wait_payment.sh - Wait for payment confirmation

ORDER_ID="$1"
REFERENCE=$(cat "/tmp/order_${ORDER_ID}_ref.txt")
RPC_URL="${SOLANA_RPC_URL:-https://api.mainnet-beta.solana.com}"

echo "Waiting for payment (reference: ${REFERENCE:0:8}...)"

while true; do
  RESULT=$(curl -s -X POST "$RPC_URL" \
    -H "Content-Type: application/json" \
    -d "{
      \"jsonrpc\": \"2.0\",
      \"id\": 1,
      \"method\": \"getSignaturesForAddress\",
      \"params\": [\"${REFERENCE}\", {\"limit\": 1}]
    }")
  
  SIG=$(echo "$RESULT" | jq -r '.result[0].signature // empty')
  
  if [[ -n "$SIG" ]]; then
    echo "✅ Payment received!"
    echo "Transaction: $SIG"
    echo "Explorer: https://solscan.io/tx/$SIG"
    break
  fi
  
  sleep 2
done
```

## Fee Comparison

| Network | Fee | Time |
|---------|-----|------|
| Solana Pay | ~$0.00025 | ~400ms |
| Visa/MC | 2-3% | 1-3 days |
| PayPal | 2.9% + $0.30 | Instant |
| Wire Transfer | $25-50 | 1-5 days |

## Safety Rules

1. **ALWAYS** verify transaction signature before fulfilling orders
2. **ALWAYS** check recipient matches merchant wallet
3. **ALWAYS** verify amount matches expected payment
4. **USE** unique reference for each payment request
5. **NEVER** reuse reference keys

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| No transaction found | Payment not made | Continue polling |
| Wrong recipient | Spoofed payment | Reject, alert user |
| Wrong amount | Partial payment | Request remaining |
| Transaction failed | Insufficient funds | Request retry |

## Links

- [Solana Pay Docs](https://docs.solanapay.com/)
- [Solana Pay GitHub](https://github.com/solana-labs/solana-pay)
- [Solscan Explorer](https://solscan.io/)
