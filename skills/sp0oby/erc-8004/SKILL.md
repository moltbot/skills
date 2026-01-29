---
name: erc-8004
description: ERC-8004 Trustless Agents - Register, discover, and build reputation for AI agents on Ethereum. Use when registering agents on-chain, querying agent registries, giving/receiving reputation feedback, or interacting with the AI agent trust layer.
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
| Sepolia | ✅ Live | `0x8004a6090cd10a7288092483047b097295fb8847` |
| Base | 🔜 Pending | TBD |
| Mainnet | 🔜 Pending | TBD |

Contract addresses in `lib/contracts.json`. Browse agents at [xgate.run](https://xgate.run/agents).

## Registration File Format

```json
{
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "your-agent-name",
  "description": "Agent description...",
  "image": "ipfs://...",
  "services": [
    { "name": "ENS", "endpoint": "yourname.eth" },
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

## Resources

- [EIP-8004 Spec](https://eips.ethereum.org/EIPS/eip-8004)
- [Reference Implementation](https://github.com/ChaosChain/trustless-agents-erc-ri)
- [8004.org](https://8004.org)
