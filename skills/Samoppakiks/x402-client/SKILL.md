---
name: x402-client
description: Make and receive USDC payments over HTTP using the x402 protocol (Coinbase). The Stripe for agents — pay for services, sell your own, check balances. Works on Base network (mainnet + testnet).
metadata: {"clawdbot":{"requires":{"bins":["node"]}}}
---

# x402 Client — Agent Payment Skill

Pay for services and sell your own using USDC stablecoins over HTTP.

## Quick Start

```bash
# Install + create wallet
cd <skill-dir> && bash scripts/setup.sh

# Buy: access a paid API
node scripts/pay-request.js --url https://api.example.com/paid

# Sell: run your own paywalled service
node scripts/serve-paid.js --port 4021

# Check balance
node scripts/wallet-balance.js
```

---

## Setup

```bash
bash scripts/setup.sh
```

Creates an EVM wallet at `~/.x402/wallet.json`, installs deps. Idempotent — won't overwrite an existing wallet.

**Fund your wallet** with USDC on Base:
- **Testnet:** Circle faucet → https://faucet.circle.com (20 USDC, Base Sepolia)
- **Mainnet:** Transfer USDC from Coinbase, WazirX, or another agent

---

## Paying for Services (Client)

### CLI Script
```bash
node scripts/pay-request.js \
  --url "https://api.example.com/service" \
  --method GET \
  --network base-sepolia \
  --max-price 0.50 \
  --dry-run          # preview price without paying
```

Options:
| Flag | Default | Description |
|------|---------|-------------|
| `--url` | (required) | Service URL |
| `--method` | GET | HTTP method |
| `--body` | — | JSON body for POST/PUT |
| `--network` | base | `base` (mainnet) or `base-sepolia` (testnet) |
| `--max-price` | 1.00 | Safety cap in USD |
| `--dry-run` | false | Show price without paying |

### Programmatic (lib/client.js)
```js
import { createPayClient, getBalance } from 'x402-client/lib/client.js';

// Create a payment-enabled fetch
const payFetch = await createPayClient({ maxPrice: 0.50 });

// Use it like regular fetch — payments happen automatically
const res = await payFetch('https://api.example.com/paid');
const data = await res.json();

// Check wallet balance
const balance = await getBalance(); // { mainnet: "5.23", testnet: "19.99" }
```

---

## Selling Services (Server)

### Quick Start
```bash
# Run the template server
node scripts/serve-paid.js --port 4021 --network base-sepolia
```

Edit `serve-paid.js` to add your own endpoints. It's a template — customize freely.

### Programmatic (lib/server.js)
```js
import express from 'express';
import { createPaywall, paymentRequired } from 'x402-client/lib/server.js';

const app = express();

// Option 1: Middleware (simplest)
app.get('/api/audit',
  createPaywall({ price: 0.03, description: 'Skill audit' }),
  (req, res) => {
    res.json({ result: 'your premium content' });
  }
);

// Option 2: Manual 402 response (more control)
app.get('/api/custom', (req, res) => {
  if (!req.header('payment-signature')) {
    return paymentRequired(res, { price: 0.05 });
  }
  res.json({ result: 'paid content' });
});

app.listen(4021);
```

Server features:
- `createPaywall(opts)` — Express middleware, gates endpoint behind payment
- `paymentRequired(res, opts)` — Send a 402 with proper x402 v2 headers
- `buildPaymentRequirements(opts)` — Build requirements object manually
- Works without live Coinbase facilitator (testnet-friendly)
- Auto-reads wallet address from `~/.x402/wallet.json`

---

## Testing

```bash
# Run full end-to-end test (server + client, automated)
node scripts/test-e2e.js
```

Tests: free endpoint → 402 response → signed payment → content delivery.

---

## Wallet Management

```bash
# Show address (safe to share)
node scripts/wallet-info.js

# Check USDC balance (mainnet + testnet)
node scripts/wallet-balance.js

# Export private key (⚠️ DANGEROUS)
node scripts/wallet-info.js --export-key
```

---

## Security

- Private key stored encrypted at `~/.x402/wallet.json` (owner-only perms)
- `--max-price` prevents accidental overspending
- Always `--dry-run` first for unfamiliar services
- Keep minimal funds — only what you need for operations
- Never share private key or wallet.json

---

## How x402 Works

```
Client → GET /api/service → 402 + PAYMENT-REQUIRED header (base64 JSON)
      → parse requirements → sign USDC payment (EIP-712)
      → retry with PAYMENT-SIGNATURE header → 200 + content
```

- **Protocol:** x402 v2 (Coinbase) — payment requirements in HTTP headers
- **Currency:** USDC stablecoin (6 decimals)
- **Network:** Base (Ethereum L2) — low fees, fast settlement
- **No ETH needed:** Facilitator handles gas on-chain

---

## File Structure

```
x402-client/
├── SKILL.md              # This file
├── lib/
│   ├── client.js         # Reusable payment client wrapper
│   └── server.js         # Reusable payment server wrapper
└── scripts/
    ├── setup.sh          # One-command install
    ├── pay-request.js    # CLI: make paid requests
    ├── serve-paid.js     # CLI: run paywalled server (template)
    ├── wallet-create.js  # Generate wallet
    ├── wallet-info.js    # Show/export wallet
    ├── wallet-balance.js # Check USDC balance
    └── test-e2e.js       # End-to-end test
```
