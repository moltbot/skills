# ERC-8004 Trustless Agents Skill

On-chain identity, reputation, and validation for autonomous AI agents.

![ERC-8004](https://img.shields.io/badge/ERC-8004-blue) ![Sepolia](https://img.shields.io/badge/Network-Sepolia-green) ![License](https://img.shields.io/badge/License-MIT-yellow)

A skill for [Clawdbot](https://github.com/clawdbot/clawdbot) and [Claude Code](https://docs.anthropic.com/en/docs/claude-code) users to register AI agents on Ethereum with verifiable identity and reputation.

## Installation

### Clawdbot
```bash
# Clone to your skills directory
git clone https://github.com/tedkaczynski-the-bot/erc-8004-skill.git ~/.clawdbot/skills/erc-8004

# Or via ClawdHub (coming soon)
clawdhub install erc-8004
```

### Claude Code
```bash
# Clone to your project or global skills
git clone https://github.com/tedkaczynski-the-bot/erc-8004-skill.git skills/erc-8004
```

The skill auto-triggers when you ask about registering agents, ERC-8004, on-chain identity, or agent reputation.

## What is ERC-8004?

[ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) is an Ethereum standard that enables AI agents to discover, choose, and interact with each other across organizational boundaries without pre-existing trust.

**Three Registries:**
- **Identity Registry** - ERC-721 based agent identities with metadata
- **Reputation Registry** - Signed feedback scores between agents/clients  
- **Validation Registry** - Independent verification (zkML, TEE, stakers)

## Quick Start

### Requirements
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (`cast`)
- `jq`
- Private key in `~/.clawdbot/wallets/.deployer_pk` or `PRIVATE_KEY` env

### Register an Agent

```bash
# Register without URI (set later)
./scripts/register.sh

# Register with IPFS URI
./scripts/register.sh --uri "ipfs://QmYourHash..."
```

### Query Agents

```bash
# Total registered agents
./scripts/query.sh total

# Get agent details
./scripts/query.sh agent 2

# Get reputation summary
./scripts/query.sh reputation 2
```

### Update Registration

```bash
./scripts/set-uri.sh --agent-id 2 --uri "ipfs://QmNewHash..."
```

### Give Feedback

```bash
# Rate an agent (0-100 quality score)
./scripts/feedback.sh --agent-id 1 --score 85 --tag1 "quality"

# Rate with decimals (99.77% uptime)
./scripts/feedback.sh --agent-id 1 --score 9977 --decimals 2 --tag1 "uptime"

# Negative values supported (trading yield -3.2%)
./scripts/feedback.sh --agent-id 1 --score -32 --decimals 1 --tag1 "tradingYield"
```

## Contracts (Sepolia)

| Contract | Address |
|----------|---------|
| Official Registry | `0x8004a6090cd10a7288092483047b097295fb8847` |

This is the official ERC-8004 registry with the `0x8004` vanity address prefix. Indexed by [xgate.run](https://xgate.run/agents).

Mainnet and Base deployments coming soon - update `lib/contracts.json` when available.

## Registration File Format

```json
{
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "your-agent-name",
  "description": "What your agent does...",
  "image": "ipfs://...",
  "services": [
    { "name": "ENS", "endpoint": "yourname.eth" },
    { "name": "A2A", "endpoint": "https://..." },
    { "name": "MCP", "endpoint": "https://..." }
  ],
  "supportedTrust": ["reputation"]
}
```

## Resources

- [Clawdbot](https://github.com/clawdbot/clawdbot) - Autonomous AI agent framework
- [ClawdHub](https://clawdhub.com) - Skill marketplace for Clawdbot
- [EIP-8004 Specification](https://eips.ethereum.org/EIPS/eip-8004)
- [Reference Implementation](https://github.com/ChaosChain/trustless-agents-erc-ri)
- [8004.org](https://8004.org)

## License

MIT
