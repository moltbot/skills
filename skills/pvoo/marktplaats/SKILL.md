---
name: marktplaats
description: Search Marktplaats.nl classifieds across all categories with filtering support.
homepage: https://www.marktplaats.nl
metadata: {"clawdbot":{"emoji":"🇳🇱","requires":{"bins":["node"]}}}
---

# Marktplaats Skill

Search any Marktplaats category, filter by condition/delivery, list categories, and fetch listing details.

## CLI

```bash
npm install -g {baseDir}

# Search
marktplaats-search "<query>" [options]
  -n, --limit <num>         Number of results (default: 10, max: 100)
  -c, --category <id>       Category ID (top-level)
  --min-price <cents>       Minimum price in euro cents
  --max-price <cents>       Maximum price in euro cents
  --sort <relevance|date|price-asc|price-desc>
  --param key=value         Filter by attribute (repeatable)
  --details [target]        Fetch details for "first" result or URL/ID
  --json                    Output raw JSON

# Categories
marktplaats-categories            # main categories
marktplaats-categories <id>       # sub-categories for a category
  --json                          Output raw JSON
```

## Filters

Common filters work with `--param`:

| Filter | Values |
|--------|--------|
| `condition` | Nieuw, Refurbished, Zo goed als nieuw, Gebruikt, Niet werkend |
| `delivery` | Ophalen, Verzenden |
| `buyitnow` | true (Direct Kopen only) |

English aliases also work: `new`, `used`, `like-new`, `pickup`, `shipping`

## Examples

```bash
# New laptops only
marktplaats-search "laptop" --param condition=Nieuw

# Used cameras with shipping
marktplaats-search "camera" --param condition=Gebruikt --param delivery=Verzenden

# Cars under €15k
marktplaats-search "bmw 330d" --category 96 --max-price 1500000

# Furniture, pickup only
marktplaats-search "eettafel" --param delivery=Ophalen --sort price-asc

# Get details for first result
marktplaats-search "iphone" -n 1 --details first

# List all categories
marktplaats-categories

# BMW sub-categories
marktplaats-categories 96
```

## Programmatic API (ESM)

```js
import { searchListings, fetchCategories, getListingDetails } from '{baseDir}';

// Search with filters
const results = await searchListings({
  query: 'espresso machine',
  params: { condition: 'Nieuw', delivery: 'Verzenden' },
  limit: 10,
});

// Get categories
const categories = await fetchCategories();  // top-level
const bmw = await fetchCategories(96);       // BMW sub-categories

// Fetch listing details
const details = await getListingDetails(results.listings[0].vipUrl);
```

## Notes

- Prices are in **euro cents** (€15,000 = 1500000)
- Results include full URLs to listings
- Use `--json` to see all available facets and filter keys
- Filter hints are shown after search results
