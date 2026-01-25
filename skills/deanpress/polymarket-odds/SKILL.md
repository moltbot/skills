---
name: Polymarket
description: Query Polymarket prediction market odds and events via CLI. Search for markets, get current prices, list events by category. Supports sports betting (NFL, NBA, soccer/EPL, Champions League), politics, crypto, elections, geopolitics. Real money markets = more accurate than polls. No API key required. Use when asked about odds, probabilities, predictions, or "what are the chances of X".
---

# Polymarket Prediction Markets

Query real-time odds from Polymarket, the world's largest prediction market.

## Quick Start

```bash
# Search for markets (instant via /public-search API)
polymarket search "Arsenal FC"
polymarket search "Super Bowl"
polymarket search "Bitcoin"
polymarket search "Trump"

# Browse by category
polymarket events --tag=sports
polymarket events --tag=crypto
polymarket events --tag=politics

# Get specific market details
polymarket market will-bitcoin-reach-100k
```

The CLI is at `polymarket.mjs` in this skill folder. Run with:
```bash
node /path/to/skill/polymarket.mjs <command>
```

## Commands

| Command | Description |
|---------|-------------|
| `search <query>` | Search markets by keyword (recommended) |
| `events [options]` | List active events |
| `market <slug>` | Get market details by slug |
| `tags` | List available categories |
| `price <token_id>` | Get current price for a token |
| `book <token_id>` | Get orderbook depth |

## Event Options

- `--tag=<slug>` - Filter by category (crypto, politics, sports, etc.)
- `--limit=<n>` - Maximum results (default: 20)

## Understanding Odds

Prices = Probabilities:
- 0.65 (65¢) = 65% chance of "Yes"
- Volume = total $ traded
- Liquidity = available $ in orderbook

## Individual Match Betting

Polymarket has individual match markets for soccer, NFL, NBA, and more.

```bash
# Soccer - use "FC" suffix for team names
polymarket search "Arsenal FC"
polymarket search "Manchester United FC"
polymarket search "Liverpool FC"

# NFL/NBA - team name works
polymarket search "Patriots"
polymarket search "Chiefs"
polymarket search "Lakers"
```

**Market types available:**
- **Moneyline**: Win/Draw/Lose percentages
- **Spreads**: e.g., Arsenal -1.5
- **Totals**: Over/Under 2.5 goals
- **BTTS**: Both Teams to Score

## Common Categories

| Tag | Markets |
|-----|---------|
| `sports` | NFL, NBA, soccer, tennis, etc. |
| `politics` | Elections, legislation, appointments |
| `crypto` | Price targets, ETFs, regulations |
| `business` | IPOs, acquisitions, earnings |
| `tech` | Product launches, AI developments |

## API Reference

The CLI uses these public endpoints (no auth required):

- **Search**: `GET /public-search?q=<query>` - keyword search
- **Events**: `GET /events?active=true&closed=false` - list events
- **Markets**: `GET /markets?slug=<slug>` - market details
- **Tags**: `GET /tags` - available categories

Base URL: `https://gamma-api.polymarket.com`

## Notes

- Real money markets tend to be more accurate than polls/pundits
- Odds update in real-time as people trade
- Markets resolve to $1.00 (correct) or $0.00 (incorrect)
