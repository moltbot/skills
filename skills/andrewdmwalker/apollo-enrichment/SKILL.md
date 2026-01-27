---
name: apollo
description: Apollo.io contact and company enrichment API. Enrich people with email, phone, title, company data. Enrich organizations with industry, revenue, employee count, funding. Search for prospects. Use when the user needs to enrich contacts, find emails, lookup company info, or search for leads.
version: 1.3.0
author: captmarbles
---

# Apollo Enrichment Skill

Enrich contacts and companies using [Apollo.io](https://apollo.io) API.

## Setup

1. Get your API key from [Apollo Settings](https://app.apollo.io/#/settings/integrations/api)
2. Set the environment variable:
   ```bash
   export APOLLO_API_KEY=your-api-key-here
   ```

## Usage

All commands use the bundled `apollo.py` script in this skill's directory.

### Enrich a Person

Get email, phone, title, and company data for a contact.

```bash
# By email
python3 apollo.py enrich --email "john@acme.com"

# By name + company
python3 apollo.py enrich --name "John Smith" --domain "acme.com"

# Include personal email & phone
python3 apollo.py enrich --email "john@acme.com" --reveal-email --reveal-phone
```

### Bulk Enrich People

Enrich up to 10 people in one call.

```bash
# From JSON file with array of {email, first_name, last_name, domain}
python3 apollo.py bulk-enrich --file contacts.json

# Reveal personal contact info
python3 apollo.py bulk-enrich --file contacts.json --reveal-email --reveal-phone
```

**contacts.json example:**
```json
[
  {"email": "john@acme.com"},
  {"first_name": "Jane", "last_name": "Doe", "domain": "techcorp.io"}
]
```

### Enrich a Company

Get industry, revenue, employee count, funding data.

```bash
python3 apollo.py company --domain "stripe.com"
```

### Search for People

Find prospects by criteria.

```bash
# By title and company
python3 apollo.py search --titles "CEO,CTO" --domain "acme.com"

# By title and location
python3 apollo.py search --titles "VP Sales" --locations "San Francisco"

# Limit results
python3 apollo.py search --titles "Engineer" --domain "google.com" --limit 10

# Exclude competitors (Hathora/Edgegap/Nakama)
python3 apollo.py search --titles "CTO" --exclude-competitors
```

**Filtering Options:**
- `--exclude-competitors` or `-x` — Automatically filters out employees from Hathora, Edgegap, and Nakama (Heroic Labs)

## Example Prompts

- *"Enrich john@acme.com with Apollo"*
- *"Get company info for stripe.com"*
- *"Find CTOs at fintech companies in NYC"*
- *"Bulk enrich this list of contacts"*
- *"What's the employee count and revenue for Notion?"*

## Data Returned

**Person enrichment:**
- Name, title, headline
- Email (work & personal)
- Phone (direct & mobile)
- Company, industry
- LinkedIn URL
- Location

**Company enrichment:**
- Name, domain, logo
- Industry, keywords
- Employee count, revenue
- Funding rounds, investors
- Technologies used
- Social links

## Credits

Apollo uses credits for enrichment. Check your usage at [apollo.io/settings/credits](https://app.apollo.io/#/settings/credits).
