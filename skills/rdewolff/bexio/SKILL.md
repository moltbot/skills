---
name: bexio
description: Bexio Swiss business software API for managing contacts, quotes/offers, invoices, orders, and items/products. Use when working with Bexio CRM, creating or managing invoices, quotes, sales orders, contact management, or Swiss business administration tasks. Supports listing, searching, creating, editing contacts and sales documents.
---

# Bexio

Swiss business software API for CRM, invoicing, quotes, orders, and products.

## Setup

Get your Personal Access Token (PAT) from Bexio:
1. Go to https://office.bexio.com → Settings → Security → Personal Access Tokens
2. Create a new token with required scopes

Store in `~/.clawdbot/clawdbot.json`:
```json
{
  "skills": {
    "entries": {
      "bexio": {
        "accessToken": "YOUR_ACCESS_TOKEN"
      }
    }
  }
}
```

Or set env: `BEXIO_ACCESS_TOKEN=xxx`

## Required Scopes

- `contact_show`, `contact_edit` - Contacts
- `kb_offer_show`, `kb_offer_edit` - Quotes/Offers
- `kb_invoice_show`, `kb_invoice_edit` - Invoices
- `kb_order_show`, `kb_order_edit` - Orders
- `article_show` - Items/Products

## Quick Reference

### Contacts
```bash
{baseDir}/scripts/bexio.sh contacts list              # List all contacts
{baseDir}/scripts/bexio.sh contacts search "query"    # Search contacts
{baseDir}/scripts/bexio.sh contacts show <id>         # Get contact details
{baseDir}/scripts/bexio.sh contacts create --name "Company" --type company
{baseDir}/scripts/bexio.sh contacts edit <id> --email "new@email.com"
```

### Quotes/Offers
```bash
{baseDir}/scripts/bexio.sh quotes list                # List quotes
{baseDir}/scripts/bexio.sh quotes search "query"      # Search quotes
{baseDir}/scripts/bexio.sh quotes show <id>           # Get quote details
{baseDir}/scripts/bexio.sh quotes create --contact <id> --title "Project Quote"
{baseDir}/scripts/bexio.sh quotes clone <id>          # Clone a quote
{baseDir}/scripts/bexio.sh quotes send <id> --email "client@email.com"
```

### Invoices
```bash
{baseDir}/scripts/bexio.sh invoices list              # List invoices
{baseDir}/scripts/bexio.sh invoices search "query"    # Search invoices
{baseDir}/scripts/bexio.sh invoices show <id>         # Get invoice details
{baseDir}/scripts/bexio.sh invoices create --contact <id> --title "Invoice"
{baseDir}/scripts/bexio.sh invoices issue <id>        # Issue draft invoice
{baseDir}/scripts/bexio.sh invoices send <id> --email "client@email.com"
{baseDir}/scripts/bexio.sh invoices cancel <id>       # Cancel invoice
```

### Orders
```bash
{baseDir}/scripts/bexio.sh orders list                # List orders
{baseDir}/scripts/bexio.sh orders search "query"      # Search orders
{baseDir}/scripts/bexio.sh orders show <id>           # Get order details
{baseDir}/scripts/bexio.sh orders create --contact <id> --title "Sales Order"
```

### Items/Products
```bash
{baseDir}/scripts/bexio.sh items list                 # List all items
{baseDir}/scripts/bexio.sh items search "query"       # Search items
{baseDir}/scripts/bexio.sh items show <id>            # Get item details
```

## Document Statuses

- **Quotes**: `draft`, `pending`, `accepted`, `declined`
- **Invoices**: `draft`, `pending`, `paid`, `partial`, `canceled`
- **Orders**: `draft`, `pending`, `done`

## Notes

- API Base: `https://api.bexio.com`
- Auth: Bearer token in header
- Rate limit: ~1000 req/min (check `X-RateLimit-*` headers)
- Pagination: Use `?limit=X&offset=Y` params
- Always confirm before creating/editing documents

## API Reference

For detailed endpoint documentation, see [references/api.md](references/api.md).
