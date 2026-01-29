---
name: stock-quote
description: Get current stock quotes (price, change, changePercent) from Yahoo Finance.
user-invocable: true
metadata: {"moltbot":{"emoji":"📈","requires":{"bins":["node"]},"homepage":"https://query1.finance.yahoo.com/v7/finance/quote"}}
---

# Stock Quote (Yahoo Finance)

Get current stock price data from Yahoo Finance.

## Command

### `/stock quote`

Fetch the latest quote for one or more stock symbols.

**Input**
- `symbols`: string or array of strings  
  Example: `"AAPL"` or `["AAPL", "MSFT", "TSLA"]`

**Output**
For each symbol:
- symbol
- price
- change
- changePercent
- currency
- marketState

## How to run (implementation)

This skill is implemented by a local Node script at:

- `{baseDir}/stock-quote.js`

Run it with Node and pass symbols as args:

- `node "{baseDir}/stock-quote.js" AAPL`
- `node "{baseDir}/stock-quote.js" AAPL MSFT TSLA`
- `node "{baseDir}/stock-quote.js" "AAPL,MSFT,TSLA"`

Or pass JSON as the first argument:

- `node "{baseDir}/stock-quote.js" '{"symbols":["AAPL","MSFT"]}'`

The script prints JSON to stdout.

## Data source

Yahoo Finance quote API:
https://query1.finance.yahoo.com/v7/finance/quote

## Notes

- No authentication required
- Data may be delayed
- Read-only (no alerts, no storage)

## Version

v1.2