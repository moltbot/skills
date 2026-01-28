# Locus MCP API Reference

## Authentication
- OAuth 2.0 Client Credentials or API key (prefixed `locus_`)
- API key sent as: `Authorization: Bearer locus_...`
- Each key is tied to a wallet, permission group, and set of scopes

## Dynamic Tools

Tools are exposed per-user based on their permission group. Always discover available tools with:
```bash
mcporter list locus --schema
```

### Built-in Payment Tools

**get_payment_context**
- Scope: `payment_context:read`
- Parameters: none
- Returns: budget status, available balance, whitelisted contacts

**list_tokens**
- Scope: (included with payment tools)
- Parameters: none
- Returns: approved tokens with balances and spending limits

**send_token**
- Scope: `address_payments:write`, `email_payments:write`
- Parameters:
  - `token_symbol` (string, required): USDC, EURC, ETH, KAITO, etc.
  - `recipient` (string, required): Wallet address (0x...), ENS name, or email
  - `amount` (number, required): Amount in token units
  - `memo` (string, optional): Payment description
- Returns: transaction ID, amount, recipient, status
- Note: Email recipients get an escrow claim link

**send_token_multi**
- Scope: `address_payments:write`, `email_payments:write`
- Parameters:
  - `recipient` (string, required): Wallet address, ENS name, or email
  - `tokens` (array, required): Array of `{symbol, amount}` objects
  - `memo` (string, optional): Payment description

**approve_token**
- Scope: (DeFi permissions)
- Parameters:
  - `token_symbol` (string, required): Token to approve
  - `spender_address` (string, required): Contract address (0x...)
  - `amount` (number, required): Amount to approve in token units

### x402 Micropayment Tools
- Scope: `x402:execute`
- Dynamically generated from approved Coinbase Bazaar endpoints
- Each tool's description includes cost (e.g., "Cost: 0.01 USDC")
- Payments handled automatically by Locus on Base network
- Tool names generated from endpoint URLs (e.g., `forecast`, `get_headlines`)

## Scopes
| Scope | Access |
|---|---|
| payment_context:read | get_payment_context |
| contact_payments:write | send_to_contact |
| address_payments:write | send_to_address |
| email_payments:write | send_to_email |
| x402:execute | x402 paid API tools |

## Production
- MCP Server: `https://mcp.paywithlocus.com/mcp`
- Network: Base (on-chain settlement)
- Dashboard: https://paywithlocus.com
