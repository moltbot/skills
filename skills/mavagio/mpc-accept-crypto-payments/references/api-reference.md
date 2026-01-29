# MoonPay Commerce API Reference

Base URL: `https://api.hel.io/v1`
OpenAPI: `https://api.hel.io/v1/docs-json`
Swagger UI: `https://api.hel.io/v1/docs`

## Authentication

Two credentials from the dashboard (Settings → API Keys):

| Credential | Where | How |
|---|---|---|
| API Key (public) | Query param | `?apiKey=<KEY>` |
| API Secret | Header | `Authorization: Bearer <SECRET>` |

## Endpoints

### Currencies

#### GET /v1/currency
List all supported currencies (no auth required).

Response: Array of Currency objects:
```json
{
  "id": "string",
  "symbol": "string",       // e.g. "USDC", "SOL"
  "name": "string",
  "mintAddress": "string",
  "decimals": 6,
  "blockchain": {
    "id": "string",
    "name": "string",
    "symbol": "SOL"          // SOL, ETH, POLYGON, BASE, BITCOIN, ARBITRUM, BSC
  },
  "type": "DIGITAL",        // FIAT or DIGITAL
  "isNative": false
}
```

### Pay Links

#### POST /v1/paylink/create/api-key
Create a new Pay Link. Auth required.

Request body (`CreatePaylinkWithApiDto`):
```json
{
  "name": "string",              // REQUIRED
  "pricingCurrency": "string",   // REQUIRED — currency ID from /v1/currency
  "template": "OTHER",           // REQUIRED — see templates below
  "price": "1000000",            // int64 string in base units
  "description": "string",
  "features": {                  // REQUIRED
    "canChangePrice": false,
    "canChangeQuantity": false,
    "requireEmail": false,
    "requireFullName": false,
    "isSubscription": false,
    "canSwapTokens": false,
    "canPayWithCard": false
  },
  "recipients": [{
    "currencyId": "string",      // currency ID
    "walletId": "string"         // wallet ID from your account
  }],
  "redirectUrl": "string",
  "maxTransactions": 0,          // 0 = unlimited
  "dynamic": false               // true = payer chooses amount
}
```

Templates: `PRODUCT`, `SUBSCRIPTION`, `PRE_SALE`, `INVOICE`, `EVENT`, `OTHER`, `BLINK`, `PAYLINK_V2`, `EMBEDDED_V2`

Response: `ShallowEnrichedPaylink` with `id` field = the paylink ID.

#### PATCH /v1/paylink/{id}/api-key
Update a Pay Link. Auth required. Body: `UpdatePaylinkWithApiDto` (same fields as create, all optional).

#### PATCH /v1/paylink/{id}/disable
Disable/enable a Pay Link. Query param: `disabled=true|false`. Auth required.

#### GET /v1/paylink/{id}/transactions
Get transactions for a Pay Link. Auth required.
Query params: `senderPK`, `from`, `to` (date range).

### Charges (Checkout URLs)

#### POST /v1/charge/api-key
Create a one-time charge/checkout page for a Pay Link. Auth required.

Request body:
```json
{
  "paymentRequestId": "string",  // REQUIRED — paylink ID
  "requestAmount": "string",     // optional override amount
  "expiresAt": "string",         // optional ISO date
  "successRedirectUrl": "string" // optional redirect after payment
}
```

Response:
```json
{
  "id": "string",
  "pageUrl": "https://..."       // checkout URL for the payer
}
```

### Transactions

#### GET /v1/transactions/{prId}/transactions
Get transactions by Pay Link ID. Auth required.

#### GET /v1/transactions/signature/{signature}
Get a transaction by its Solana signature. Auth required.

### Exports

#### GET /v1/export/payments
Export all transactions. Auth required.
Query params: `nrDays` (filter by recency), `publicKey` (filter by sender).

### Webhooks

#### POST /v1/webhook/paylink/transaction
Create a webhook for Pay Link transactions. Auth required.

Request body:
```json
{
  "paylinkId": "string",
  "targetUrl": "https://...",
  "events": ["CREATED"]           // CREATED = tx confirmed on-chain
}
```

## Price Format

Prices are `int64` strings in **base units** determined by the currency's `decimals`:

| Currency | Decimals | 1.00 unit = |
|---|---|---|
| USDC | 6 | `"1000000"` |
| SOL | 9 | `"1000000000"` |
| BONK | 5 | `"100000"` |

Formula: `base_units = amount × 10^decimals`
