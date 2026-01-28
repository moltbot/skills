---
name: locus
description: Locus payment tools for AI agents. Use when asked to send payments, check wallet balances, list tokens, approve token spending, or process payment-related actions from emails. Also use for demos of Locus (YC F25) payment infrastructure — scanning emails for payment requests and initiating crypto payments via wallet.
---

# Locus Payment Skill

Locus MCP provides crypto payment tools for AI agents via `mcporter`. Tools are dynamic — each user sees only what their permission group allows.

## Setup

On first use, check if locus is configured:
```bash
mcporter config get locus 2>/dev/null
```

If not configured, run the setup script:
```bash
bash skills/locus/scripts/setup.sh
```

Or configure manually:
```bash
mcporter config add locus \
  --url "https://mcp.paywithlocus.com/mcp" \
  --header "Authorization=Bearer <YOUR_LOCUS_API_KEY>" \
  --scope home
```

Get your API key at https://paywithlocus.com — each agent gets its own key tied to a wallet and permission group.

### Requirements
- `mcporter` CLI installed (`npm i -g mcporter`)

## Discovering Available Tools

Tools are dynamically exposed based on your permission group. Always discover what's available first:
```bash
mcporter list locus --schema
```

### Common Built-in Tools

These may be available depending on your permissions:

**get_payment_context** — Check budget status, balance, and whitelisted contacts.
```bash
mcporter call locus.get_payment_context
```

**list_tokens** — List approved tokens with balances and spending limits.
```bash
mcporter call locus.list_tokens
```

**send_token** — Send a token to a wallet address, ENS name, or email.
```bash
mcporter call locus.send_token token_symbol=USDC recipient=alice@example.com amount=10 memo="Invoice payment"
```
- Wallet addresses (0x...) → direct on-chain (Base network)
- Email addresses → escrow (recipient gets email to claim)
- ENS names (vitalik.eth) → resolved on-chain

**send_token_multi** — Send multiple tokens to one recipient.
```bash
mcporter call locus.send_token_multi recipient=0x742d... --args '{"tokens":[{"symbol":"USDC","amount":10},{"symbol":"ETH","amount":0.01}],"memo":"Multi-token payment"}'
```

**approve_token** — Approve a smart contract to spend tokens (ERC-20 allowance).
```bash
mcporter call locus.approve_token token_symbol=USDC spender_address=0x... amount=100
```

### x402 Tools

Your permission group may also include x402 micropayment tools — dynamically generated from approved API endpoints. These let your agent pay for and consume external APIs autonomously. Run `mcporter list locus --schema` to see all available tools.

## Email → Payment Flow

1. Scan inbox for payment-related emails (invoices, bills, splits, reimbursements)
2. Identify actionable items with amounts, recipients, and context
3. Summarize findings to user
4. On user approval, execute payments via available send tools
5. **Always confirm with user before sending any payment**

## Safety Rules

- **Never send payments without explicit user confirmation**
- Always show: recipient, token, amount, and memo before executing
- Use `list_tokens` first to verify available balance
- Use `get_payment_context` to check budget limits
- Double-check recipient addresses — typos mean lost funds
- Confirm large payments (>$100) with extra care
