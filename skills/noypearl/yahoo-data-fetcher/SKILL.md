# Stock Quote (Yahoo Finance)

Get current stock price data from Yahoo Finance.

## Command

### `stock quote`

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

## Example

- “Stock quote for AAPL”
- “Get stock quote for TSLA and NVDA”

## Data source

Yahoo Finance quote API:
https://query1.finance.yahoo.com/v7/finance/quote
## Notes

- No authentication required
- Data may be delayed
- Read-only (no alerts, no storage)

## Version

v1.0