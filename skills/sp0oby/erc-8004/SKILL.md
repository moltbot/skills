---
name: erc-8004
description: ERC-8004 Trustless Agents - Register, discover, and build reputation for AI agents on Ethereum. Use when registering Ted/unabotter on-chain, querying agent registries, giving/receiving reputation feedback, or interacting with the AI agent trust layer.
---

# ERC-8004: Trustless Agents

On-chain identity, reputation, and validation for autonomous agents.

## Overview

ERC-8004 provides three registries:
- **Identity Registry** - ERC-721 agent identities with registration metadata
- **Reputation Registry** - Signed feedback scores between agents/clients
- **Validation Registry** - Independent verification (zkML, TEE, stakers)

## Quick Reference

### Register Agent
```bash
./scripts/register.sh --uri "ipfs://..."
./scripts/register.sh  # No URI, set later
```

### Query Agents
```bash
./scripts/query.sh total                    # Total registered
./scripts/query.sh agent 1                  # Agent details
./scripts/query.sh reputation 1             # Reputation summary
```

### Update Agent
```bash
./scripts/set-uri.sh --agent-id 1 --uri "ipfs://newHash"
```

### Give Feedback
```bash
./scripts/feedback.sh --agent-id 1 --score 85 --tag1 "quality"
./scripts/feedback.sh --agent-id 1 --score 9977 --decimals 2 --tag1 "uptime"
```

## Networks

| Network | Status | Identity Registry |
|---------|--------|-------------------|
| Sepolia | ✅ Live | `0xf66e7CBdAE1Cb710fee7732E4e1f173624e137A7` |
| Base | 🔜 Pending | TBD |
| Mainnet | 🔜 Pending | TBD |

Contract addresses in `lib/contracts.json`.

## Registration File Format

```json
{
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "unabotter",
  "description": "Agent description...",
  "image": "ipfs://...",
  "services": [
    { "name": "ENS", "endpoint": "unabotter.base.eth" },
    { "name": "A2A", "endpoint": "https://..." },
    { "name": "MCP", "endpoint": "https://..." }
  ],
  "supportedTrust": ["reputation"]
}
```

Template at `templates/registration.json`.

## Reputation Scores

| Tag | Meaning | Example | value | decimals |
|-----|---------|---------|-------|----------|
| starred | Quality (0-100) | 87/100 | 87 | 0 |
| uptime | Uptime % | 99.77% | 9977 | 2 |
| tradingYield | Yield % | -3.2% | -32 | 1 |
| responseTime | Latency ms | 560ms | 560 | 0 |

## Dependencies

- `cast` (Foundry) - `curl -L https://foundry.paradigm.xyz | bash`
- `jq` - `brew install jq`
- Private key in `~/.clawdbot/wallets/.deployer_pk` or `PRIVATE_KEY` env
- IPFS: Set `PINATA_JWT` for uploads, or upload manually

## Ted's Identity

Ted (unabotter) registration:
- Wallet: `0x81FD234f63Dd559d0EDA56d17BB1Bb78f236DB37`
- ENS: `unabotter.base.eth`
- Agent ID: TBD (register on Sepolia first)

## Resources

- [EIP-8004 Spec](https://eips.ethereum.org/EIPS/eip-8004)
- [Reference Implementation](https://github.com/ChaosChain/trustless-agents-erc-ri)
- [8004.org](https://8004.org)
