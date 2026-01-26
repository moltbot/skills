---
name: x402
description: Pay for x402 APIs autonomously with USDC. Discover endpoints via Bazaar, execute payments, access paid services.
metadata: {"clawdbot":{"emoji":"💸","homepage":"https://x402.org","requires":{"env":["X402_PRIVATE_KEY"]},"primaryEnv":"X402_PRIVATE_KEY","install":[{"id":"npm","kind":"node","package":"@civic/x402-mcp","bins":["npx"],"label":"Install x402-mcp (npm)"}]}}
---

# x402 - Autonomous Agent Payments

Pay for x402-enabled APIs with USDC on Base. Discover paid endpoints via the Bazaar, execute micropayments, and access services without accounts or API keys.

## What is x402?

x402 is an open payment protocol that enables AI agents to pay for API access autonomously using stablecoins (USDC). When a service returns HTTP 402 "Payment Required", the agent can automatically sign a payment and retry the request.

## Quick Start

### 1. Set up your wallet

Export a private key from a wallet with USDC on Base (mainnet or Sepolia testnet):

```bash
export X402_PRIVATE_KEY="0x..."
```

**⚠️ Security**: Use a dedicated wallet with limited funds for agent payments. Never use your main wallet.

### 2. Fund your wallet

- **Testnet (Base Sepolia)**: Get test USDC from [Coinbase Faucet](https://portal.cdp.coinbase.com/products/faucet)
- **Mainnet (Base)**: Bridge USDC to Base via [bridge.base.org](https://bridge.base.org)

## Discovering x402 Endpoints

### Query the Bazaar

The x402 Bazaar is the discovery layer for paid APIs. Query it to find available services:

```bash
# List all available x402 services
curl -s "https://x402.org/facilitator/discovery/resources?limit=20" | jq '.resources[] | {url: .resource, price: .accepts[0].price, network: .accepts[0].network}'

# Search by category (if supported)
curl -s "https://x402.org/facilitator/discovery/resources?type=http&limit=50" | jq '.'
```

### Alternative Directories

- **x402.org/ecosystem** - Curated list of x402-enabled services
- **x402index.com** - Community directory of x402 endpoints
- **x402apis.io** - Decentralized API registry on Solana

## Making Paid Requests

### Using @civic/x402-mcp (Recommended for MCP)

If running as an MCP server (e.g., with Claude Desktop), configure in `~/.config/claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "x402": {
      "command": "npx",
      "args": ["@civic/x402-mcp"],
      "env": {
        "PRIVATE_KEY": "${X402_PRIVATE_KEY}",
        "TARGET_URL": "https://x402-mcp.fly.dev/mcp"
      }
    }
  }
}
```

### Using curl with manual payment flow

```bash
# Step 1: Make initial request (will get 402)
curl -i https://api.example.com/x402/endpoint

# Step 2: Parse payment requirements from 402 response
# Look for X-PAYMENT-REQUIRED header with payment details

# Step 3: Sign payment and retry (requires wallet integration)
```

### Using the x402 TypeScript SDK

```typescript
import { x402Client, wrapAxiosWithPayment } from "@x402/axios";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";
import axios from "axios";

// Create x402 client
const client = new x402Client();
const signer = privateKeyToAccount(process.env.X402_PRIVATE_KEY);
registerExactEvmScheme(client, { signer });

// Wrap axios with payment handling
const api = wrapAxiosWithPayment(axios.create(), client);

// Make paid request - payment handled automatically on 402
const response = await api.get("https://api.example.com/x402/weather");
```

## Common x402 Endpoints

### Weather Data
- Price: ~$0.001/request
- Returns real-time weather data

### AI Inference
- Price: varies by model
- Run inference on hosted models

### Data APIs
- Price: ~$0.001-0.01/request
- Access premium data feeds

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `X402_PRIVATE_KEY` | Yes | Hex-encoded private key (with 0x prefix) |
| `X402_NETWORK` | No | `base` (mainnet) or `base-sepolia` (testnet). Default: `base-sepolia` |
| `X402_MAX_PAYMENT` | No | Maximum payment per request in USDC (e.g., `0.10`). Default: unlimited |

## Checking Wallet Balance

```bash
# Check USDC balance on Base Sepolia
cast balance --erc20 0x036CbD53842c5426634e7929541eC2318f3dCF7e $WALLET_ADDRESS --rpc-url https://sepolia.base.org

# Check USDC balance on Base Mainnet  
cast balance --erc20 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 $WALLET_ADDRESS --rpc-url https://mainnet.base.org
```

## Security Best Practices

1. **Dedicated wallet**: Create a separate wallet just for agent payments
2. **Limited funding**: Only keep small amounts of USDC in the agent wallet
3. **Max payment limits**: Set `X402_MAX_PAYMENT` to cap per-request spending
4. **Testnet first**: Always test on Base Sepolia before mainnet
5. **Monitor spending**: Track wallet balance and transaction history

## Troubleshooting

### "Insufficient funds"
- Check USDC balance on the correct network (Base vs Base Sepolia)
- Ensure you have ETH for gas fees

### "Payment verification failed"
- Verify the facilitator URL is reachable
- Check that your wallet address matches the signer

### "Network mismatch"
- Confirm the endpoint's required network matches your wallet's network
- Some endpoints only support mainnet or testnet

## Resources

- [x402 Documentation](https://docs.cdp.coinbase.com/x402)
- [x402 Protocol Spec](https://x402.org)
- [Coinbase x402 GitHub](https://github.com/coinbase/x402)
- [Base Network](https://base.org)

## Related Skills

- `solana-swaps` - For Solana-based x402 payments
- `crypto-tracker` - Monitor wallet balances
