---
name: freshdesk
description: Manage support tickets, contacts, and knowledge base via Freshdesk API. Create, update, and resolve customer issues.
metadata: {"clawdbot":{"emoji":"🎧","requires":{"env":["FRESHDESK_DOMAIN","FRESHDESK_API_KEY"]}}}
---

# Freshdesk

Customer support platform.

## Environment

```bash
export FRESHDESK_DOMAIN="yourcompany"  # yourcompany.freshdesk.com
export FRESHDESK_API_KEY="xxxxxxxxxx"
```

## List Tickets

```bash
curl "https://$FRESHDESK_DOMAIN.freshdesk.com/api/v2/tickets" \
  -u "$FRESHDESK_API_KEY:X"
```

## Get Ticket

```bash
curl "https://$FRESHDESK_DOMAIN.freshdesk.com/api/v2/tickets/{id}" \
  -u "$FRESHDESK_API_KEY:X"
```

## Create Ticket

```bash
curl -X POST "https://$FRESHDESK_DOMAIN.freshdesk.com/api/v2/tickets" \
  -u "$FRESHDESK_API_KEY:X" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Support needed",
    "description": "I need help with...",
    "email": "customer@example.com",
    "priority": 2,
    "status": 2
  }'
```

## Update Ticket

```bash
curl -X PUT "https://$FRESHDESK_DOMAIN.freshdesk.com/api/v2/tickets/{id}" \
  -u "$FRESHDESK_API_KEY:X" \
  -H "Content-Type: application/json" \
  -d '{"status": 4, "priority": 3}'
```

## Reply to Ticket

```bash
curl -X POST "https://$FRESHDESK_DOMAIN.freshdesk.com/api/v2/tickets/{id}/reply" \
  -u "$FRESHDESK_API_KEY:X" \
  -H "Content-Type: application/json" \
  -d '{"body": "Thanks for reaching out! Here is your solution..."}'
```

## List Contacts

```bash
curl "https://$FRESHDESK_DOMAIN.freshdesk.com/api/v2/contacts" \
  -u "$FRESHDESK_API_KEY:X"
```

## Search Tickets

```bash
curl "https://$FRESHDESK_DOMAIN.freshdesk.com/api/v2/search/tickets?query=\"status:2\"" \
  -u "$FRESHDESK_API_KEY:X"
```

## Priority/Status Values
- Priority: 1=Low, 2=Medium, 3=High, 4=Urgent
- Status: 2=Open, 3=Pending, 4=Resolved, 5=Closed

## Links
- Dashboard: https://yourcompany.freshdesk.com
- Docs: https://developers.freshdesk.com
