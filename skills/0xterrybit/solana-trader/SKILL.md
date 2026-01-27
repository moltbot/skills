---
name: solana-trader
description: Solana wallet management and token trading via Jupiter aggregator. Check balances, view transaction history, swap tokens, and manage your Solana portfolio.
metadata: {"clawdbot":{"emoji":"🚀","always":true,"requires":{"bins":["curl","jq"]}}}
---

# Solana Trader 🚀

A comprehensive Solana wallet management and trading skill for Clawdbot. Manage your Solana portfolio, check balances, view transaction history, and swap tokens using Jupiter DEX aggregator.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SOLANA_KEYPAIR_PATH` | Path to wallet keypair JSON file | Yes |
| `SOLANA_RPC_URL` | Custom RPC endpoint (default: mainnet-beta) | No |
| `JUPITER_API_KEY` | Jupiter API key for authenticated requests | No |
| `HELIUS_API_KEY` | Helius API key for enhanced transaction data | No |
| `SHYFT_API_KEY` | Shyft API key for transaction history | No |
| `QUICKNODE_RPC_URL` | QuickNode RPC endpoint | No |
| `ALCHEMY_RPC_URL` | Alchemy Solana RPC endpoint | No |

## 🌐 Free Public RPC Endpoints (No API Key Required)

| Provider | Endpoint | Notes |
|----------|----------|-------|
| Solana Foundation | `https://api.mainnet-beta.solana.com` | Official, rate limited |
| PublicNode | `https://solana-rpc.publicnode.com` | Privacy-first, fast |
| Ankr | `https://rpc.ankr.com/solana` | Free public endpoint |
| Project Serum | `https://solana-api.projectserum.com` | Community maintained |

> ⚠️ **Rate Limits**: Public endpoints typically limit to ~100 requests/10 seconds. For production or high-frequency trading, use a paid RPC provider.

### RPC Selection Strategy

**Default behavior (no API keys configured):**
1. Try `SOLANA_RPC_URL` if set
2. Fall back to free public endpoints in order:
   - `https://api.mainnet-beta.solana.com`
   - `https://solana-rpc.publicnode.com`
   - `https://rpc.ankr.com/solana`

**When to upgrade to paid RPC:**
- Rate limit errors (429 Too Many Requests)
- High-frequency trading or MEV
- Need for enhanced transaction data (Helius)
- Production applications requiring 99.9% uptime
- WebSocket subscriptions for real-time updates

**If rate limited**, ask user: "Would you like to configure a paid RPC provider? Options: Helius, QuickNode, Alchemy, Shyft"

## 💎 Referral Fee Configuration

This skill includes a small platform fee (0.2%) on swaps to support development. The fee is transparently disclosed to users before each swap.

| Variable | Value | Description |
|----------|-------|-------------|
| `PLATFORM_FEE_BPS` | 20 | 0.2% platform fee (20 basis points) |
| `FEE_ACCOUNT` | `8KDDpruBwpTzJLKEcfv8JefKSVYWYE53FV3B2iLD6bNN` | Solana wallet to receive fees |

**Fee Breakdown:**
- User pays: 0.2% of swap output
- Developer receives: 97.5% of fee (0.195%)
- Jupiter receives: 2.5% of fee (0.005%)

**Example**: On a 100 USDC swap output:
- Total fee: 0.20 USDC
- You receive: ~0.195 USDC
- Jupiter receives: ~0.005 USDC

## Setup Verification

```bash
# Check wallet address
solana address --keypair "$SOLANA_KEYPAIR_PATH"

# Check Solana CLI config
solana config get

# Test RPC connection
solana cluster-version
```

### Import Private Key

If you only have a private key (base58 string or byte array), convert it to keypair JSON:

**From Base58 private key:**
```bash
# Install solana-keygen if needed
# Your private key looks like: 5K1gR...xyz (base58 string)

echo "Enter your base58 private key:"
read -s PRIVATE_KEY

# Convert to keypair JSON (requires Node.js)
node -e "
const bs58 = require('bs58');
const key = bs58.decode('$PRIVATE_KEY');
console.log(JSON.stringify(Array.from(key)));
" > ~/.config/solana/imported-wallet.json

export SOLANA_KEYPAIR_PATH=~/.config/solana/imported-wallet.json
```

**From byte array (e.g., Phantom export):**
```bash
# If you have a byte array like [12,34,56,...]
echo '[12,34,56,78,...]' > ~/.config/solana/imported-wallet.json
export SOLANA_KEYPAIR_PATH=~/.config/solana/imported-wallet.json
```

**From seed phrase (mnemonic):**
```bash
# Use solana-keygen to recover
solana-keygen recover -o ~/.config/solana/recovered-wallet.json
# Enter your 12/24 word seed phrase when prompted

export SOLANA_KEYPAIR_PATH=~/.config/solana/recovered-wallet.json
```

> ⚠️ **Security**: Never share your private key or seed phrase. Store keypair files with restricted permissions: `chmod 600 ~/.config/solana/*.json`

---

## 💰 Balance Commands

### Check SOL Balance

```bash
solana balance --keypair "$SOLANA_KEYPAIR_PATH"
```

### List All Token Accounts

```bash
spl-token accounts --owner $(solana address --keypair "$SOLANA_KEYPAIR_PATH")
```

### Check Specific Token Balance

```bash
# Replace <MINT_ADDRESS> with token mint
spl-token balance <MINT_ADDRESS> --owner $(solana address --keypair "$SOLANA_KEYPAIR_PATH")
```

### Get Portfolio Summary

```bash
# Get wallet address
WALLET=$(solana address --keypair "$SOLANA_KEYPAIR_PATH")

# Get SOL balance
SOL_BALANCE=$(solana balance --keypair "$SOLANA_KEYPAIR_PATH" | awk '{print $1}')

# Get all token accounts
spl-token accounts --owner $WALLET
```

---

## 📜 Transaction History

### View Recent Transactions

Multiple RPC providers supported. Default uses native Solana RPC (no API key required).

**Option 1: Solana RPC (default, no API key)**
```bash
WALLET=$(solana address --keypair "$SOLANA_KEYPAIR_PATH")
RPC_URL="${SOLANA_RPC_URL:-https://api.mainnet-beta.solana.com}"

curl -s -X POST "$RPC_URL" \
  -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getSignaturesForAddress\",\"params\":[\"$WALLET\",{\"limit\":10}]}" | jq '.result[] | {signature: .signature, slot: .slot, blockTime: .blockTime}'
```

**Option 2: Helius (enhanced data, recommended for detailed history)**
```bash
WALLET=$(solana address --keypair "$SOLANA_KEYPAIR_PATH")

curl -s "https://api.helius.xyz/v0/addresses/${WALLET}/transactions?api-key=${HELIUS_API_KEY:-demo}&limit=10" | jq '.[] | {signature: .signature, type: .type, timestamp: .timestamp, fee: .fee}'
```

**Option 3: Shyft (free tier available)**
```bash
WALLET=$(solana address --keypair "$SOLANA_KEYPAIR_PATH")

curl -s "https://api.shyft.to/sol/v1/transaction/history?network=mainnet-beta&account=${WALLET}&tx_num=10" \
  -H "x-api-key: ${SHYFT_API_KEY}" | jq '.result.transactions'
```

**Option 4: QuickNode**
```bash
WALLET=$(solana address --keypair "$SOLANA_KEYPAIR_PATH")

curl -s -X POST "$QUICKNODE_RPC_URL" \
  -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getSignaturesForAddress\",\"params\":[\"$WALLET\",{\"limit\":10}]}" | jq '.result'
```

**Option 5: Alchemy**
```bash
WALLET=$(solana address --keypair "$SOLANA_KEYPAIR_PATH")

curl -s -X POST "$ALCHEMY_RPC_URL" \
  -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getSignaturesForAddress\",\"params\":[\"$WALLET\",{\"limit\":10}]}" | jq '.result[] | {signature: .signature, slot: .slot, blockTime: .blockTime}'
```

> 💡 **Provider Selection**: AI will auto-detect available API keys and use the best provider. If no keys configured, defaults to native Solana RPC.

### View Transaction Details

```bash
# Replace <SIGNATURE> with transaction signature
solana confirm -v <SIGNATURE>

# Or via RPC for more details
RPC_URL="${SOLANA_RPC_URL:-https://api.mainnet-beta.solana.com}"
curl -s -X POST "$RPC_URL" \
  -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getTransaction\",\"params\":[\"<SIGNATURE>\",{\"encoding\":\"jsonParsed\",\"maxSupportedTransactionVersion\":0}]}" | jq '.result'
```

---

## 🪙 Common Token Addresses

| Token | Symbol | Mint Address | Decimals |
|-------|--------|--------------|----------|
| Wrapped SOL | SOL | So11111111111111111111111111111111111111112 | 9 |
| USD Coin | USDC | EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v | 6 |
| Tether | USDT | Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB | 6 |
| Bonk | BONK | DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263 | 5 |
| Jupiter | JUP | JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN | 6 |
| Raydium | RAY | 4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R | 6 |
| Pyth | PYTH | HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3 | 6 |
| Jito | JTO | jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL | 9 |

---

## 🔄 Token Swaps via Jupiter

**⚠️ CRITICAL: Always display swap details and wait for explicit user confirmation before executing any swap.**

### Step 1: Get Swap Quote

Convert human-readable amounts to raw units:
- SOL: multiply by 1,000,000,000 (10^9)
- USDC/USDT/JUP: multiply by 1,000,000 (10^6)
- BONK: multiply by 100,000 (10^5)

```bash
# Example: Quote for swapping 1 SOL to USDC
INPUT_MINT="So11111111111111111111111111111111111111112"
OUTPUT_MINT="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
AMOUNT="1000000000"  # 1 SOL in lamports
SLIPPAGE_BPS="50"    # 0.5% slippage
PLATFORM_FEE_BPS="20"  # 0.2% platform fee

# Get quote with platform fee
QUOTE=$(curl -s "https://api.jup.ag/swap/v1/quote?inputMint=${INPUT_MINT}&outputMint=${OUTPUT_MINT}&amount=${AMOUNT}&slippageBps=${SLIPPAGE_BPS}&platformFeeBps=${PLATFORM_FEE_BPS}")

echo "$QUOTE" | jq '{
  inputAmount: .inAmount,
  outputAmount: .outAmount,
  priceImpact: .priceImpactPct,
  minimumReceived: .otherAmountThreshold,
  platformFee: .platformFee
}'
```

### Step 2: Display Quote and Request Confirmation

Parse and display to user:
- Input: amount and token name
- Output: expected amount and token name  
- Price impact percentage
- Slippage tolerance
- Minimum received amount
- **Platform fee: 0.2% (supports skill development)**

**IMPORTANT**: Ask user "Do you want to proceed with this swap?" and wait for explicit confirmation ("yes", "proceed", "confirm") before continuing.

**Display Format Example:**
```
📊 Swap Preview:
├─ From: 1.0 SOL
├─ To: ~150.25 USDC (estimated)
├─ Price Impact: 0.01%
├─ Slippage: 0.5%
├─ Minimum Received: 149.50 USDC
├─ Platform Fee: 0.2% (~0.30 USDC)
└─ Network Fee: ~0.000005 SOL

⚠️ Confirm swap? (yes/no)
```

### Step 3: Build Swap Transaction

After user confirms:

```bash
USER_PUBKEY=$(solana address --keypair "$SOLANA_KEYPAIR_PATH")

# Fee account for referral rewards
FEE_ACCOUNT="8KDDpruBwpTzJLKEcfv8JefKSVYWYE53FV3B2iLD6bNN"

# Save quote to file
echo "$QUOTE" > /tmp/jupiter_quote.json

# Request swap transaction with fee account
SWAP_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  "https://api.jup.ag/swap/v1/swap" \
  -d "{
    \"quoteResponse\": $(cat /tmp/jupiter_quote.json),
    \"userPublicKey\": \"${USER_PUBKEY}\",
    \"feeAccount\": \"${FEE_ACCOUNT}\",
    \"dynamicComputeUnitLimit\": true,
    \"prioritizationFeeLamports\": {
      \"priorityLevelWithMaxLamports\": {
        \"maxLamports\": 5000000,
        \"priorityLevel\": \"high\"
      }
    }
  }")

# Extract transaction
SWAP_TX=$(echo "$SWAP_RESPONSE" | jq -r '.swapTransaction')
```

> 💡 **Note**: The `feeAccount` receives the platform fee in the output token. Make sure you have token accounts for common tokens (USDC, USDT, etc.) to receive fees.

### Step 4: Sign and Submit Transaction

```bash
# Decode base64 transaction
echo "$SWAP_TX" | base64 -d > /tmp/swap_tx.bin

# Sign with keypair (requires solana-cli)
solana transfer --from "$SOLANA_KEYPAIR_PATH" \
  --blockhash $(solana block-height) \
  --sign-only \
  /tmp/swap_tx.bin

# Or use the raw transaction submission
curl -s -X POST "https://api.mainnet-beta.solana.com" \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 1,
    \"method\": \"sendTransaction\",
    \"params\": [\"${SWAP_TX}\", {\"encoding\": \"base64\"}]
  }"
```

---

## 💸 Send Tokens

### Send SOL

```bash
# ALWAYS confirm with user before sending!
RECIPIENT="<RECIPIENT_ADDRESS>"
AMOUNT="0.1"  # SOL amount

# Display and confirm
echo "Sending ${AMOUNT} SOL to ${RECIPIENT}"
echo "Confirm? (yes/no)"

# After confirmation:
solana transfer --keypair "$SOLANA_KEYPAIR_PATH" "$RECIPIENT" "$AMOUNT"
```

### Send SPL Tokens

```bash
# ALWAYS confirm with user before sending!
RECIPIENT="<RECIPIENT_ADDRESS>"
TOKEN_MINT="<TOKEN_MINT_ADDRESS>"
AMOUNT="100"  # Token amount

# Display and confirm
echo "Sending ${AMOUNT} tokens (${TOKEN_MINT}) to ${RECIPIENT}"
echo "Confirm? (yes/no)"

# After confirmation:
spl-token transfer --keypair "$SOLANA_KEYPAIR_PATH" "$TOKEN_MINT" "$AMOUNT" "$RECIPIENT"
```

---

## 📊 Price Checking

### Get Token Price from Jupiter

```bash
# Get SOL price in USDC
curl -s "https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112" | jq '.data.So11111111111111111111111111111111111111112.price'

# Get multiple token prices
curl -s "https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112,JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN" | jq '.data'
```

### Get Token Info

```bash
# Search token by symbol or name
curl -s "https://tokens.jup.ag/token/<MINT_ADDRESS>" | jq '{name: .name, symbol: .symbol, decimals: .decimals}'
```

---

## 🛡️ Safety Rules

1. **ALWAYS** display transaction details and wait for user confirmation before executing
2. **NEVER** execute swaps or transfers automatically without explicit approval
3. **ALWAYS** check balance before attempting transactions
4. **WARN** users if price impact exceeds 1%
5. **WARN** users if slippage is set above 1% (100 bps)
6. **NEVER** log, display, or transmit private key contents
7. **ALWAYS** show transaction signature and explorer link after execution

---

## ⚠️ Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| "Insufficient balance" | Not enough tokens | Check balance, reduce amount |
| "Slippage tolerance exceeded" | Price moved during swap | Get fresh quote, increase slippage |
| "Transaction expired" | Blockhash too old | Get fresh quote and retry |
| "Account not found" | Missing token account | Will be created automatically |
| "Route not found" | No liquidity | Try smaller amount or different pair |

### Retry Logic

If a transaction fails:
1. Wait 2-3 seconds
2. Get a fresh quote (prices may have changed)
3. Re-confirm with user showing new quote
4. Retry the transaction

---

## 📝 Example Interactions

### Check Balance
```
User: "What's my SOL balance?"
→ Run: solana balance --keypair "$SOLANA_KEYPAIR_PATH"
→ Report: "Your wallet has X.XXX SOL"
```

### Swap Tokens
```
User: "Swap 0.5 SOL for USDC"
→ Get Jupiter quote for 0.5 SOL → USDC (with platformFeeBps=20)
→ Display:
   "📊 Swap Preview:
    ├─ From: 0.5 SOL
    ├─ To: ~75.50 USDC (estimated)
    ├─ Price Impact: 0.01%
    ├─ Minimum Received: 75.12 USDC
    ├─ Platform Fee: 0.2% (~0.15 USDC)
    └─ Network Fee: ~0.000005 SOL
    
    Confirm swap? (yes/no)"
→ Wait for "yes"
→ Execute swap with feeAccount
→ Report: "✅ Swap successful! TX: https://solscan.io/tx/..."
```

### Send Tokens
```
User: "Send 10 USDC to ABC123..."
→ Display:
   "Transfer Preview:
    - Amount: 10 USDC
    - To: ABC123...
    - Network Fee: ~0.000005 SOL
    
    Confirm transfer? (yes/no)"
→ Wait for "yes"
→ Execute transfer
→ Report: "✅ Transfer successful! TX: https://solscan.io/tx/..."
```

---

## 🔗 Useful Links

- [Solscan Explorer](https://solscan.io/)
- [Jupiter Aggregator](https://jup.ag/)
- [Solana Documentation](https://docs.solana.com/)
- [SPL Token Documentation](https://spl.solana.com/token)
