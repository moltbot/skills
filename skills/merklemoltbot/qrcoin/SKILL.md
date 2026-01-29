---
name: qrcoin
description: Interact with QR Coin auctions on Base. Create bids, contribute to existing bids, check auction status, and monitor token details. Use when user wants to participate in qrcoin.fun QR code auctions.
metadata: {"clawdbot":{"emoji":"📱","always":false,"requires":{"bins":["curl","jq"]}}}
---

# QR Coin Auction 📱

Interact with [QR Coin](https://qrcoin.fun) auctions on Base blockchain. QR Coin lets you bid to display URLs on QR codes — the highest bidder's URL gets encoded.

## Contracts (Base Mainnet)

| Contract | Address |
|----------|---------|
| QR Auction | `0x7309779122069EFa06ef71a45AE0DB55A259A176` |
| USDC | `0x833589fCD6eDb6E08f4c7c32D4f71b54bdA02913` |
| QR Token | `0xFfFFfFff58b6fc02E91A79AE6BEf0C97d4eed2b7` |

## Quick Reference

### Check Auction Status

```bash
# Get current token ID
curl -s -X POST https://mainnet.base.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0x7309779122069EFa06ef71a45AE0DB55A259A176","data":"0x7d9f6db5"},"latest"],"id":1}' \
  | jq -r '.result' | xargs printf "%d\n"

# Get auction end time for token ID
TOKEN_ID_HEX=$(printf '%064x' $TOKEN_ID)
curl -s -X POST https://mainnet.base.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0x7309779122069EFa06ef71a45AE0DB55A259A176","data":"0xa4d0a17e'"$TOKEN_ID_HEX"'"},"latest"],"id":1}' \
  | jq -r '.result'
```

### Check Reserve Prices

```bash
# Create bid reserve (~11.11 USDC)
curl -s -X POST https://mainnet.base.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0x7309779122069EFa06ef71a45AE0DB55A259A176","data":"0x5b3bec22"},"latest"],"id":1}' \
  | jq -r '.result' | xargs printf "%d\n" | awk '{print $1/1000000 " USDC"}'

# Contribute reserve (~1.00 USDC)
curl -s -X POST https://mainnet.base.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0x7309779122069EFa06ef71a45AE0DB55A259A176","data":"0xda5a5cf3"},"latest"],"id":1}' \
  | jq -r '.result' | xargs printf "%d\n" | awk '{print $1/1000000 " USDC"}'
```

## Transactions

### Approve USDC

Before bidding, approve the auction contract to spend USDC.

**Function:** `approve(address spender, uint256 amount)`
**To:** `0x833589fCD6eDb6E08f4c7c32D4f71b54bdA02913` (USDC)
**Spender:** `0x7309779122069EFa06ef71a45AE0DB55A259A176` (Auction)

```
Function Selector: 0x095ea7b3
Parameters:
  - spender: 0x7309779122069EFa06ef71a45AE0DB55A259A176
  - amount: <USDC amount in 6 decimals>
```

### Create New Bid

Create a new bid with your URL.

**Function:** `createBid(uint256 tokenId, string memory url, string memory name)`
**To:** `0x7309779122069EFa06ef71a45AE0DB55A259A176`

```
Function Selector: 0xf7842286
Parameters:
  - tokenId: Current auction token ID
  - url: The URL you want displayed (e.g., "https://example.com")
  - name: Your identifier (e.g., X handle without @)
```

**Cost:** ~11.11 USDC (createBidReserve)

### Contribute to Existing Bid

Add funds to an existing URL's bid.

**Function:** `contributeToBid(uint256 tokenId, string memory url, string memory name)`
**To:** `0x7309779122069EFa06ef71a45AE0DB55A259A176`

```
Function Selector: 0x7ce28d02
Parameters:
  - tokenId: Current auction token ID
  - url: The URL of the existing bid
  - name: Your identifier
```

**Cost:** ~1.00 USDC (contributeReserve)

## Transaction with Bankr

When using @bankrbot for transactions:

```
@bankrbot approve 50 USDC to 0x7309779122069EFa06ef71a45AE0DB55A259A176 on base

@bankrbot send transaction to 0x7309779122069EFa06ef71a45AE0DB55A259A176 on base with data 0x... 
```

Build calldata using the function selectors and ABI encoding above.

## ABI Encoding Helper

### Encode createBid

```bash
# Function: createBid(uint256,string,string)
# Selector: 0xf7842286

TOKEN_ID=329
URL="https://example.com"
NAME="MerkleMoltBot"

# ABI encode (requires python3 with eth-abi)
python3 << PYEOF
from eth_abi import encode
data = encode(['uint256', 'string', 'string'], [$TOKEN_ID, '$URL', '$NAME'])
print('0xf7842286' + data.hex())
PYEOF
```

### Encode contributeToBid

```bash
# Function: contributeToBid(uint256,string,string)
# Selector: 0x7ce28d02

TOKEN_ID=329
URL="https://grokipedia.com/page/debtreliefbot"
NAME="MerkleMoltBot"

# ABI encode
python3 << PYEOF
from eth_abi import encode
data = encode(['uint256', 'string', 'string'], [$TOKEN_ID, '$URL', '$NAME'])
print('0x7ce28d02' + data.hex())
PYEOF
```

## Error Codes

| Error | Meaning |
|-------|---------|
| `RESERVE_PRICE_NOT_MET` | Bid amount below minimum |
| `URL_ALREADY_HAS_BID` | Use contributeToBid instead |
| `BID_NOT_FOUND` | URL doesn't have existing bid |
| `AUCTION_OVER` | Current auction has ended |
| `AUCTION_NOT_STARTED` | Auction hasn't begun yet |

## Workflow

1. **Check auction status** - Get current token ID and time remaining
2. **Approve USDC** - One-time approval for the auction contract
3. **Create or contribute:**
   - `createBid` - Start a new bid for your URL (~11.11 USDC)
   - `contributeToBid` - Add to existing URL bid (~1.00 USDC)
4. **Monitor** - Watch for lead changes as others bid

## Links

- Platform: https://qrcoin.fun
- Contract: [BaseScan](https://basescan.org/address/0x7309779122069EFa06ef71a45AE0DB55A259A176)
- Token: [BaseScan](https://basescan.org/token/0xFfFFfFff58b6fc02E91A79AE6BEf0C97d4eed2b7)
