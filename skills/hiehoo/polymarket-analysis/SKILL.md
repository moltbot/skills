---
name: polymarket-analysis
description: Analyze Polymarket prediction markets for trading edges. Pair Cost arbitrage, whale tracking, sentiment analysis, momentum signals, user profile tracking. No execution.
version: 2.1.0
---

# Polymarket Analysis

Identify trading advantages in Polymarket prediction markets through multi-modal analysis.

**Scope:** Analysis and opportunity identification only. No trade execution.

## Modes

| Mode | Description | Reference |
|------|-------------|-----------|
| **Analyze** | One-time market analysis | This file |
| **Monitor** | 24/7 market monitoring | `references/market-monitoring-setup.md` |
| **Profile** | Track user wallet positions | `scripts/fetch-polymarket-user-profile.py` |

## Scripts

```bash
# Monitor market for alerts
python3 scripts/monitor-polymarket-market.py <market_url_or_id>

# Fetch user profile/positions
python3 scripts/fetch-polymarket-user-profile.py <wallet_address> [--trades] [--pnl]
```

## Quick Start

### Market Analysis
1. Get market URL from user
2. Fetch via `https://gamma-api.polymarket.com/markets?slug={slug}`
3. Run multi-strategy analysis

### User Profile
```bash
# From profile URL: polymarket.com/profile/0x...
python3 scripts/fetch-polymarket-user-profile.py 0x7845bc5e15bc9c41be5ac0725e68a16ec02b51b5
```

## Core Strategies

| Strategy | Description | Reference |
|----------|-------------|-----------|
| Pair Cost Arbitrage | YES+NO < $1.00 | `references/pair-cost-arbitrage.md` |
| Momentum | RSI, MA signals | `references/momentum-analysis.md` |
| Whale Tracking | Large trades | `references/whale-tracking.md` |
| Sentiment | News/social | `references/sentiment-analysis.md` |

## Alert Thresholds

| Event | Threshold |
|-------|-----------|
| Price change | ±5% in 1h |
| Large trade | >$5,000 |
| Pair cost | <$0.98 |
| Volume spike | >2x avg |

## APIs

| API | Base URL | Use |
|-----|----------|-----|
| Gamma | `gamma-api.polymarket.com` | Markets, prices |
| Data | `data-api.polymarket.com` | User positions, trades, P&L |
| CLOB | `clob.polymarket.com` | Order books, trading |

See `references/polymarket-api.md` for full endpoint reference.

## References

- `references/polymarket-api.md` - API endpoints (Gamma, Data, CLOB)
- `references/market-monitoring-setup.md` - 24/7 cron monitoring
- `references/pair-cost-arbitrage.md` - Arbitrage detection
- `references/momentum-analysis.md` - Technical analysis
- `references/whale-tracking.md` - Smart money tracking
- `references/sentiment-analysis.md` - Sentiment aggregation
