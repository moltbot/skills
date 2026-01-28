# Bexio API Reference

Base URL: `https://api.bexio.com`  
Auth: `Authorization: Bearer {access_token}`

## Contacts

### List Contacts
```
GET /2.0/contact
Query: limit, offset, show_archived
Scope: contact_show
```

### Search Contacts
```
POST /2.0/contact/search
Body: [{"field": "name_1", "value": "query", "criteria": "like"}]
Scope: contact_show

Searchable fields: name_1, name_2, mail, address, city, postcode, phone_fixed, phone_mobile
Criteria: =, !=, >, <, >=, <=, like, not_like, is_null, not_null
```

### Get Contact
```
GET /2.0/contact/{id}
Scope: contact_show
```

### Create Contact
```
POST /2.0/contact
Scope: contact_edit
Body: {
  "contact_type_id": 1,  // 1=company, 2=person
  "name_1": "Company Name",
  "name_2": "Subtitle",
  "owner_id": 1,
  "mail": "email@example.com",
  "phone_fixed": "+41 44 123 45 67",
  "phone_mobile": "+41 79 123 45 67",
  "address": "Street 123",
  "postcode": "8000",
  "city": "Zürich",
  "country_id": 1,  // 1=Switzerland
  "url": "https://example.com",
  "remarks": "Notes"
}
```

### Edit Contact
```
POST /2.0/contact/{id}
Scope: contact_edit
Body: (partial update - only fields to change)
```

### Restore Archived Contact
```
POST /2.0/contact/{id}/restore
Scope: contact_edit
```

## Quotes (Offers)

### List Quotes
```
GET /2.0/kb_offer
Query: limit, offset
Scope: kb_offer_show
```

### Search Quotes
```
POST /2.0/kb_offer/search
Body: [{"field": "title", "value": "query", "criteria": "like"}]
Scope: kb_offer_show

Searchable fields: title, document_nr, contact_id, user_id, kb_item_status_id
```

### Get Quote
```
GET /2.0/kb_offer/{id}
Scope: kb_offer_show
```

### Create Quote
```
POST /2.0/kb_offer
Scope: kb_offer_edit
Body: {
  "title": "Quote Title",
  "contact_id": 123,
  "user_id": 1,
  "is_valid_from": "2024-01-01",
  "is_valid_until": "2024-01-31",
  "mwst_type": 0,  // 0=incl VAT, 1=excl VAT
  "mwst_is_net": true,
  "positions": [
    {
      "type": "KbPositionArticle",
      "article_id": 1,
      "amount": "1",
      "unit_price": "100.00",
      "text": "Service description"
    }
  ]
}
```

### Edit Quote
```
POST /2.0/kb_offer/{id}
Scope: kb_offer_edit
```

### Clone Quote
```
POST /2.0/kb_offer/{id}/copy
Scope: kb_offer_edit
```

### Send Quote
```
POST /2.0/kb_offer/{id}/send
Scope: kb_offer_edit
Body: {
  "recipient_email": "client@example.com",
  "subject": "Your Quote",
  "message": "Please find attached...",
  "mark_as_open": true,
  "attach_pdf": true
}
```

### Get Quote PDF
```
GET /2.0/kb_offer/{id}/pdf
Scope: kb_offer_show
Returns: PDF binary
```

## Invoices

### List Invoices
```
GET /2.0/kb_invoice
Query: limit, offset
Scope: kb_invoice_show
```

### Search Invoices
```
POST /2.0/kb_invoice/search
Body: [{"field": "title", "value": "query", "criteria": "like"}]
Scope: kb_invoice_show

Searchable fields: title, document_nr, contact_id, user_id, kb_item_status_id, api_reference
```

### Get Invoice
```
GET /2.0/kb_invoice/{id}
Scope: kb_invoice_show
```

### Create Invoice
```
POST /2.0/kb_invoice
Scope: kb_invoice_edit
Body: {
  "title": "Invoice Title",
  "contact_id": 123,
  "user_id": 1,
  "is_valid_from": "2024-01-01",
  "is_valid_to": "2024-01-31",
  "mwst_type": 0,
  "mwst_is_net": true,
  "positions": [
    {
      "type": "KbPositionArticle",
      "article_id": 1,
      "amount": "1",
      "unit_price": "100.00",
      "text": "Service description"
    }
  ]
}
```

### Edit Invoice
```
POST /2.0/kb_invoice/{id}
Scope: kb_invoice_edit
```

### Issue Invoice (Draft → Pending)
```
POST /2.0/kb_invoice/{id}/issue
Scope: kb_invoice_edit
```

### Send Invoice
```
POST /2.0/kb_invoice/{id}/send
Scope: kb_invoice_edit
Body: {
  "recipient_email": "client@example.com",
  "subject": "Your Invoice",
  "message": "Please find attached...",
  "mark_as_open": true,
  "attach_pdf": true
}
```

### Cancel Invoice
```
POST /2.0/kb_invoice/{id}/cancel
Scope: kb_invoice_edit
```

### Revert to Draft
```
POST /2.0/kb_invoice/{id}/revert_issue
Scope: kb_invoice_edit
```

### Get Invoice PDF
```
GET /2.0/kb_invoice/{id}/pdf
Scope: kb_invoice_show
Returns: PDF binary
```

## Orders

### List Orders
```
GET /2.0/kb_order
Query: limit, offset
Scope: kb_order_show
```

### Search Orders
```
POST /2.0/kb_order/search
Body: [{"field": "title", "value": "query", "criteria": "like"}]
Scope: kb_order_show
```

### Get Order
```
GET /2.0/kb_order/{id}
Scope: kb_order_show
```

### Create Order
```
POST /2.0/kb_order
Scope: kb_order_edit
Body: {
  "title": "Order Title",
  "contact_id": 123,
  "user_id": 1,
  "is_valid_from": "2024-01-01",
  "mwst_type": 0,
  "mwst_is_net": true,
  "positions": [...]
}
```

### Edit Order
```
PUT /2.0/kb_order/{id}
Scope: kb_order_edit
```

### Get Order PDF
```
GET /2.0/kb_order/{id}/pdf
Scope: kb_order_show
```

## Items (Articles)

### List Items
```
GET /2.0/article
Query: limit, offset
Scope: article_show
```

### Search Items
```
POST /2.0/article/search
Body: [{"field": "intern_name", "value": "query", "criteria": "like"}]
Scope: article_show

Searchable fields: intern_name, intern_code
```

### Get Item
```
GET /2.0/article/{id}
Scope: article_show
```

## Position Types

For quotes, invoices, and orders:

- `KbPositionArticle` - Article from catalog
- `KbPositionText` - Text-only line
- `KbPositionSubtotal` - Subtotal line
- `KbPositionPagebreak` - Page break
- `KbPositionDiscount` - Discount line

## Status IDs

### Quotes/Offers
| ID | Status |
|----|--------|
| 1 | Draft |
| 2 | Pending |
| 3 | Accepted |
| 4 | Declined |

### Orders
| ID | Status |
|----|--------|
| 5 | Draft |
| 6 | Pending |
| 10 | Done |

### Invoices
| ID | Status |
|----|--------|
| 7 | Draft |
| 8 | Pending |
| 9 | Paid |
| 16 | Partial |
| 19 | Canceled |

## Pagination

All list endpoints support:
- `limit` - Max results (default: 500, max: 2000)
- `offset` - Skip N results

## Search Criteria

| Criteria | Description |
|----------|-------------|
| `=` | Exact match |
| `!=` | Not equal |
| `>` | Greater than |
| `<` | Less than |
| `>=` | Greater or equal |
| `<=` | Less or equal |
| `like` | Contains (case-insensitive) |
| `not_like` | Does not contain |
| `is_null` | Is null |
| `not_null` | Is not null |

## Rate Limiting

Headers returned:
- `X-RateLimit-Limit` - Requests allowed per window
- `X-RateLimit-Remaining` - Requests remaining
- `X-RateLimit-Reset` - Window reset timestamp

## Error Responses

```json
{
  "error_code": 422,
  "message": "Validation failed",
  "errors": [
    {"field": "contact_id", "message": "Contact not found"}
  ]
}
```

Common codes:
- 401: Unauthorized (invalid token)
- 403: Forbidden (missing scope)
- 404: Not found
- 422: Validation error
- 429: Rate limited
