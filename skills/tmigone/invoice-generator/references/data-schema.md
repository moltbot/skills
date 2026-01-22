# Invoice Data Schema

Complete documentation of the JSON input format for invoice generation.

## Top-Level Structure

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `company` | object | Yes | Sender/biller information |
| `client` | object | Yes | Recipient/customer information |
| `invoice` | object | Yes | Invoice metadata |
| `items` | array | Yes | Line items on the invoice |
| `totals` | object | Yes | Summary totals |

## Company Object

Information about the entity issuing the invoice.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Company or individual name |
| `address` | string | Yes | Street address (can include newlines) |
| `cityStateZip` | string | Yes | City, state/province, and postal code |
| `country` | string | Yes | Country name |

## Client Object

Information about the invoice recipient.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Client company or individual name |
| `address` | string | Yes | Street address |
| `cityStateZip` | string | Yes | City, state/province, and postal code |
| `country` | string | Yes | Country name |
| `taxId` | string | Yes | Tax identification number |

## Invoice Object

Metadata about the invoice itself.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `number` | string | Yes | Unique invoice identifier (e.g., "INV-2025.01") |
| `date` | string | Yes | Invoice issue date (e.g., "Jan 15 2025") |
| `dueDate` | string | Yes | Payment due date |

## Items Array

Each item in the array represents a line item on the invoice.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `description` | string | Yes | Description of the service or product |
| `rate` | string | Yes | Price/rate as formatted string (e.g., "1500.00") |
| `currency` | string | Yes | Currency code (e.g., "USD", "EUR") |

## Totals Object

Summary financial information.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `currency` | string | Yes | Currency code for totals |
| `total` | string | Yes | Total amount as formatted string (e.g., "1,500.00") |

## Example

```json
{
  "company": {
    "name": "Acme Corp",
    "address": "123 Business Ave\nSuite 100",
    "cityStateZip": "San Francisco, CA 94102",
    "country": "United States"
  },
  "client": {
    "name": "Client Inc.",
    "address": "456 Customer St",
    "cityStateZip": "New York, NY 10001",
    "country": "United States",
    "taxId": "12-3456789"
  },
  "invoice": {
    "number": "INV-2025.01",
    "date": "Jan 15 2025",
    "dueDate": "Jan 30 2025"
  },
  "items": [
    {
      "description": "Consulting services - January 2025",
      "rate": "5000.00",
      "currency": "USD"
    },
    {
      "description": "Software license",
      "rate": "500.00",
      "currency": "USD"
    }
  ],
  "totals": {
    "currency": "USD",
    "total": "5,500.00"
  }
}
```
