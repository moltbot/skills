---
name: stock-analysis
description: Analyze US stocks using Yahoo Finance data for earnings season. Provides buy/hold/sell signals based on earnings surprises, fundamental metrics (P/E, margins, growth, debt), analyst sentiment (ratings, price targets), historical patterns, market context, sector performance, earnings timing warnings, momentum indicators, PLUS comprehensive sentiment analysis (Fear/Greed Index, short interest, VIX term structure, insider trading, put/call ratio). Detects "sell the news" scenarios and overbought conditions. Expected runtime 6-10s per stock. Use when asked about stock analysis, earnings reactions, fundamental health, or investment signals during quarterly earnings.
homepage: https://finance.yahoo.com
metadata: {"clawdbot":{"emoji":"📈","requires":{"bins":["uv"],"env":[]},"install":[{"id":"uv-brew","kind":"brew","formula":"uv","bins":["uv"],"label":"Install uv (brew)"}]}}
---

# Stock Analysis

Analyze US stocks using Yahoo Finance data for quick actionable insights during earnings season.

## Quick Start

**IMPORTANT:** Pass ONLY the stock ticker symbol(s) as arguments. Do NOT add extra text, headers, or formatting in the command.

Analyze a single ticker:

```bash
uv run {baseDir}/scripts/analyze_stock.py AAPL
uv run {baseDir}/scripts/analyze_stock.py MSFT --output json
```

Compare multiple tickers:

```bash
uv run {baseDir}/scripts/analyze_stock.py AAPL MSFT GOOGL
```

**Examples:**
- ✅ CORRECT: `uv run {baseDir}/scripts/analyze_stock.py BAC`
- ❌ WRONG: `uv run {baseDir}/scripts/analyze_stock.py === BANK OF AMERICA (BAC) - Q4 2025 EARNINGS ===`
- ❌ WRONG: `uv run {baseDir}/scripts/analyze_stock.py "Bank of America"`

Use the ticker symbol only (e.g., BAC, not "Bank of America").

## Analysis Components

The script evaluates eight key dimensions:

1. **Earnings Surprise (30% weight)**: Actual vs expected EPS, revenue beats/misses
2. **Fundamentals (20% weight)**: P/E ratio, profit margins, revenue growth, debt levels
3. **Analyst Sentiment (20% weight)**: Consensus ratings, price target vs current price
4. **Historical Patterns (10% weight)**: Past earnings reactions, volatility
5. **Market Context (10% weight)**: VIX, SPY/QQQ trends, market regime
6. **Sector Performance (15% weight)**: Stock vs sector comparison, sector trends
7. **Momentum (15% weight)**: RSI, 52-week range, volume, relative strength
8. **Sentiment Analysis (10% weight)**: Fear/Greed Index, short interest, VIX term structure, insider trading, put/call ratio

**Sentiment Sub-Indicators:**
- **Fear & Greed Index (CNN)**: Contrarian signal (extreme fear = buy opportunity, extreme greed = caution)
- **Short Interest**: High shorts + squeeze potential = bullish; justified shorts = bearish
- **VIX Term Structure**: Contango = complacency/bullish; backwardation = stress/bearish
- **Insider Activity**: Net buying/selling from SEC Form 4 filings (90-day window)
- **Put/Call Ratio**: High ratio = excessive fear/bullish; low ratio = complacency/bearish

Weights auto-normalize if some components unavailable.

**Special Timing Checks:**
- Pre-earnings warning (< 14 days): Recommends HOLD instead of BUY
- Post-earnings spike detection (> 15% in 5 days): Flags "gains priced in"
- Overbought conditions (RSI > 70 + near 52w high): Reduces confidence

## Timing Warnings & Risk Flags

The script now detects high-risk scenarios:

- **Pre-Earnings Period**: If earnings < 14 days away, BUY signals become HOLD
- **Post-Earnings Spike**: If stock up > 15% in 5 days after earnings, warns "gains may be priced in"
- **Overbought Conditions**: RSI > 70 + near 52-week high = high-risk entry
- **Sector Weakness**: Stock may look good but sector is rotating out
- **High VIX**: Market fear (VIX > 30) reduces confidence in BUY signals

## Output Format

**Default (text)**: Concise buy/hold/sell signal with 3-5 bullet points and caveats

**JSON**: Structured data with scores, metrics, and raw data for further analysis

## Limitations

- **Data freshness**: Yahoo Finance may lag 15-20 minutes
- **Sentiment data staleness**:
  - Short interest data lags ~2 weeks (FINRA reporting schedule)
  - Insider trades may lag filing by 2-3 days
  - VIX term structure only updates during futures trading hours
- **Missing data**: Not all stocks have analyst coverage, options chains, or complete fundamentals
- **Execution time**: 6-10s per stock due to sentiment data fetching (up from 3-5s without sentiment)
- **Disclaimer**: All outputs include prominent "not financial advice" warning
- **US markets only**: Non-US tickers may have incomplete data

## Error Handling

The script gracefully handles:
- Invalid tickers → Clear error message
- Missing analyst data → Signal based on available metrics only
- API failures → Retry with exponential backoff, fail after 3 attempts
