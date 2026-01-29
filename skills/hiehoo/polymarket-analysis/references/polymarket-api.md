# Polymarket API Reference

Two main APIs: **Gamma** (markets) and **Data** (user profiles).

## Base URLs

```
Gamma API: https://gamma-api.polymarket.com
Data API:  https://data-api.polymarket.com
CLOB API:  https://clob.polymarket.com
```

## Data API (User Profiles)

### User Positions
```bash
GET https://data-api.polymarket.com/positions?user={wallet_address}
```

Response fields per position:
- `market`: Market name/question
- `outcome`: YES/NO
- `size`: Number of shares
- `avgPrice`: Entry price
- `currentPrice`: Current market price
- `pnl`: Unrealized profit/loss

### User Trades
```bash
GET https://data-api.polymarket.com/trades?user={wallet_address}
```

### Profit/Loss History
```bash
GET https://data-api.polymarket.com/profit-loss?user={wallet_address}
```

### User Leaderboard Rank
```bash
GET https://data-api.polymarket.com/leaderboard?user={wallet_address}
```

## Gamma API (Markets)

### List Markets
```bash
GET /markets?active=true&closed=false&limit=50
```

### Market Details
```bash
GET /markets/{market_id}
```

### Market by Slug
```bash
GET /markets?slug={market-slug}
```

### Order Book
```bash
GET /book/{token_id}
```

### Price History
```bash
GET /prices/{token_id}?interval=1h
```

Intervals: `1m`, `5m`, `15m`, `1h`, `4h`, `1d`

### Leaderboard
```bash
GET /leaderboard?window=all
```

Windows: `daily`, `weekly`, `monthly`, `all`

## CLOB API (Trading)

### Price
```bash
GET /price?tokenId={token_id}
```

### Midpoint
```bash
GET /midpoint?tokenId={token_id}
```

### Order Book
```bash
GET /book?tokenId={token_id}
```

## Examples

```bash
# User positions
curl "https://data-api.polymarket.com/positions?user=0x7845bc5e15bc9c41be5ac0725e68a16ec02b51b5"

# User trades
curl "https://data-api.polymarket.com/trades?user=0x7845bc5e15bc9c41be5ac0725e68a16ec02b51b5"

# Active markets
curl "https://gamma-api.polymarket.com/markets?active=true&closed=false"

# Market by slug
curl "https://gamma-api.polymarket.com/markets?slug=will-bitcoin-outperform-gold-in-2026"
```

## Rate Limits

- Public endpoints: ~100 req/min
- No auth required for read-only
- WebSocket: `wss://ws-subscriptions-clob.polymarket.com/ws/market`
