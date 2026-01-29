---
name: simmer-signalsniper
description: Snipe Polymarket opportunities from your own signal sources. Monitors RSS feeds with Trading Agent-grade safeguards.
metadata: {"clawdbot":{"emoji":"🎯","requires":{"env":["SIMMER_API_KEY"]},"cron":"0 * * * *"}}
authors:
  - Simmer (@simmer_markets)
---

# Simmer Signal Sniper

Your signals, Simmer's trading intelligence.

## When to Use This Skill

Use this skill when the user wants to:
- Monitor RSS feeds for trading opportunities
- Trade on breaking news before markets react
- Configure their own signal sources and keywords
- Get Trading Agent-grade safeguards on their trades

## Quick Commands

```bash
# Check account balance and positions
python scripts/status.py

# Detailed position list
python scripts/status.py --positions
```

**API Reference:**
- Base URL: `https://api.simmer.markets`
- Auth: `Authorization: Bearer $SIMMER_API_KEY`
- Portfolio: `GET /api/sdk/portfolio`
- Positions: `GET /api/sdk/positions`

## Quick Start (Ad-Hoc Usage)

**User provides RSS feed and market directly:**
```
User: "Watch this RSS feed for greenland news: https://news.google.com/rss/search?q=greenland"
User: "Snipe any news about trump from this feed"
```

→ Run with `--feed` and `--market` flags:
```bash
python signal_sniper.py --feed "https://news.google.com/rss/search?q=greenland" --market "greenland-acquisition" --dry-run
```

## Persistent Setup (Optional)

For automated recurring scans, configure via environment:

| Setting | Environment Variable | Default | Description |
|---------|---------------------|---------|-------------|
| RSS Feeds | `SIMMER_SNIPER_FEEDS` | (none) | Comma-separated RSS URLs |
| Markets | `SIMMER_SNIPER_MARKETS` | (none) | Comma-separated market IDs |
| Keywords | `SIMMER_SNIPER_KEYWORDS` | (none) | Comma-separated keywords to match |
| Confidence | `SIMMER_SNIPER_CONFIDENCE` | 0.7 | Min confidence to trade (0.0-1.0) |
| Max USD | `SIMMER_SNIPER_MAX_USD` | 25 | Max per trade |
| Max trades/run | `SIMMER_SNIPER_MAX_TRADES` | 5 | Maximum trades per scan cycle |

**Polymarket Constraints:**
- Minimum 5 shares per order
- Trades below this threshold are rejected with an error message

## How It Works

Each cycle the script:
1. Polls configured RSS feeds
2. Filters articles by keywords (if configured)
3. Matches articles to target markets
4. For each match, calls SDK context endpoint for safeguards:
   - Position awareness (already holding?)
   - Flip-flop detection (recently changed direction?)
   - Slippage estimates (is market liquid?)
   - Time decay (resolving soon?)
   - Resolution criteria (what actually resolves this market?)
5. If safeguards pass, you (Claude) analyze the signal
6. If confident, executes trade via SDK
7. Tracks processed articles to avoid duplicates

## Running the Skill

**Run a scan:**
```bash
python signal_sniper.py
```

**Dry run (no actual trades):**
```bash
python signal_sniper.py --dry-run
```

**Check for signals without trading:**
```bash
python signal_sniper.py --scan-only
```

**View current config:**
```bash
python signal_sniper.py --config
```

**Override for one run:**
```bash
python signal_sniper.py --feed "https://..." --keywords "trump,greenland" --market "abc123"
```

**Show processed articles:**
```bash
python signal_sniper.py --history
```

## Interpreting Context Warnings

Before trading, ALWAYS check the context warnings. The skill will show you:

| Warning | Action |
|---------|--------|
| `MARKET RESOLVED` | Do NOT trade |
| `HIGH URGENCY: Resolves in Xh` | Consider if signal is timely enough |
| `flip_flop_warning: SEVERE` | Skip - you've been reversing too much |
| `flip_flop_warning: CAUTION` | Proceed carefully, need strong signal |
| `Wide spread (X%)` | Reduce position size or skip |
| `Simmer AI signal: X% more bullish/bearish` | Consider Simmer's oracle opinion |

## Analyzing Signals

When you find a matching article, analyze it carefully:

1. **Read the headline and summary** - What is the actual news?

2. **Check resolution_criteria** - What ACTUALLY resolves this market?
   - Example: "greenland" in headline doesn't mean "acquisition complete"
   - The resolution might be "US formally acquires Greenland by 2027"
   - Does this signal move the needle on THAT specific criteria?

3. **Assess confidence** (0.0-1.0):
   - How directly does this signal relate to resolution criteria?
   - Is the source credible?
   - Is this news likely already priced in?

4. **Only trade if**:
   - Confidence > threshold (default 0.7)
   - No severe warnings
   - Signal validates against resolution criteria

## Example Conversations

**User: "Set up news sniping for the Greenland market"**
→ Ask for RSS feeds they want to monitor
→ Configure with market ID and keywords
→ Enable cron for recurring scans

**User: "Check this feed for trading signals"**
→ Run: `python signal_sniper.py --feed "URL" --scan-only`
→ Show found articles and potential matches

**User: "Snipe any bitcoin news from CoinDesk"**
→ Run with CoinDesk RSS and bitcoin-related markets
→ Show matches and ask if they want to trade

**User: "What signals have we processed?"**
→ Run: `python signal_sniper.py --history`
→ Show recent articles and actions taken

## Example Trade Flow

```
1. RSS poll finds: "Trump and Denmark reach preliminary Greenland agreement"
2. Keywords match: "greenland", "trump"
3. Call context endpoint for market "greenland-acquisition-2027"
4. Check warnings: none severe ✓
5. Resolution criteria: "Resolves YES if US formally acquires Greenland by 2027"
6. You analyze: "preliminary agreement" ≠ "formally acquires" but bullish signal
7. Confidence: 0.75 (positive indicator, not definitive)
8. Check slippage: 2.5% on $25 ✓
9. Execute: BUY YES $25
10. Report: "🎯 Sniped: Trump/Greenland agreement → BUY YES $25"
```

## Troubleshooting

**"No feeds configured"**
- Provide feeds in message: "watch this RSS: https://..."
- Or set `SIMMER_SNIPER_FEEDS` environment variable

**"No matching articles found"**
- Check keywords are correct
- RSS feed might not have recent articles
- Try `--scan-only` to see what's in the feed

**"Skipped due to flip-flop warning"**
- You've been changing direction too much on this market
- Wait before trading again, or find new information

**"Slippage too high"**
- Market is illiquid
- Reduce trade size or skip

**"Already processed"**
- This article was already seen
- Working as intended (dedup)

## Finding Good RSS Feeds

Tips for choosing signal sources:
- **Google News RSS**: `https://news.google.com/rss/search?q=YOUR_TOPIC`
- **Niche sources**: Better than mainstream (less priced in)
- **Official sources**: Government, company announcements
- **Twitter lists → RSS**: Use services like Nitter or RSS.app

The skill works best when:
- Feeds are relevant to your target markets
- You have specific keywords to filter noise
- Sources publish before mainstream coverage
