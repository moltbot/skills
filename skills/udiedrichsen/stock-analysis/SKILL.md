---
name: stock-analysis
description: Analyze US stocks using Yahoo Finance data for earnings season. Provides buy/hold/sell signals based on earnings surprises, fundamental metrics (P/E, margins, growth, debt), analyst sentiment (ratings, price targets), and historical earnings patterns. Use when asked about stock analysis, earnings reactions, fundamental health, or investment signals during quarterly earnings.
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

The script evaluates four key dimensions:

1. **Earnings Surprise**: Actual vs expected EPS, revenue beats/misses
2. **Fundamentals**: P/E ratio, profit margins, revenue growth, debt levels
3. **Analyst Sentiment**: Consensus ratings, price target vs current price
4. **Historical Patterns**: Past earnings reactions, volatility

## Output Format

**Default (text)**: Concise buy/hold/sell signal with 3-5 bullet points and caveats

**JSON**: Structured data with scores, metrics, and raw data for further analysis

## Limitations

- **Data freshness**: Yahoo Finance may lag 15-20 minutes
- **Missing data**: Not all stocks have analyst coverage or complete fundamentals
- **Disclaimer**: All outputs include prominent "not financial advice" warning
- **US markets only**: Non-US tickers may have incomplete data

## Error Handling

The script gracefully handles:
- Invalid tickers → Clear error message
- Missing analyst data → Signal based on available metrics only
- API failures → Retry with exponential backoff, fail after 3 attempts
