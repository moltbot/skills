# Marktplaats CLI & JS Client

Search Marktplaats.nl classifieds with a clean CLI and JavaScript client. Works for all categories, supports attribute filtering, and includes a detail fetcher.

## Install

```bash
npm install -g .
# or use locally with: npx marktplaats-search "road bike"
```

Requires Node 18+ (uses built-in `fetch`).

## CLI

### Search

```bash
marktplaats-search "<query>" [options]

Options:
  -n, --limit <num>         Number of results (default 10, max 100)
  -c, --category <id>       Category ID (top-level)
  --min-price <cents>       Minimum price in euro cents
  --max-price <cents>       Maximum price in euro cents
  --sort <relevance|date|price-asc|price-desc>
  --param key=value         Filter by attribute (repeatable)
  --details [target]        Fetch detail page for "first" result or a URL/ID
  --json                    Output raw JSON from the API
  -h, --help                Show help
```

### Filters

Filter results with `--param`:

| Filter | Values |
|--------|--------|
| `condition` | Nieuw, Refurbished, Zo goed als nieuw, Gebruikt, Niet werkend |
| `delivery` | Ophalen, Verzenden |
| `buyitnow` | true (Direct Kopen only) |

English aliases work too: `new`, `used`, `like-new`, `broken`, `pickup`, `shipping`

### Examples

```bash
# New laptops only
marktplaats-search "laptop" --param condition=Nieuw

# Used cameras with shipping
marktplaats-search "camera" --param condition=Gebruikt --param delivery=Verzenden

# BMW under €15k, sorted by price
marktplaats-search "bmw 330d" --category 96 --max-price 1500000 --sort price-asc

# Furniture, pickup only
marktplaats-search "eettafel" --param delivery=Ophalen

# Get full details for first result
marktplaats-search "iphone" -n 1 --details first
```

### Categories

```bash
marktplaats-categories            # main categories
marktplaats-categories <id>       # sub-categories

Options:
  --json        Output raw JSON
  -h, --help    Show help
```

Examples:

```bash
marktplaats-categories           # Show all 36 main categories
marktplaats-categories 91        # Cars sub-categories (BMW, Audi, etc.)
marktplaats-categories 504       # Home & Living sub-categories
```

## Programmatic API

```js
import { searchListings, fetchCategories, getListingDetails } from 'marktplaats';

// Search with filters
const results = await searchListings({
  query: 'espresso machine',
  limit: 10,
  params: { condition: 'Nieuw', delivery: 'Verzenden' },
});

console.log(`Found ${results.total} results`);
results.listings.forEach(listing => {
  console.log(`${listing.title} - ${listing.priceDisplay}`);
});

// Get categories
const categories = await fetchCategories();  // top-level
const bmw = await fetchCategories(96);       // BMW sub-categories

// Fetch listing details
const details = await getListingDetails(results.listings[0].vipUrl);
console.log(details.description);
```

## API Reference

### searchListings(options)

Search for listings.

**Options:**
- `query` (string, required) - Search query
- `limit` (number) - Max results (default: 10, max: 100)
- `categoryId` (number) - Category ID filter
- `minPrice` (number) - Min price in cents
- `maxPrice` (number) - Max price in cents
- `sort` ('relevance' | 'date' | 'price-asc' | 'price-desc')
- `params` (object) - Attribute filters like `{ condition: 'Nieuw' }`

**Returns:** `{ listings, total, facets, categories, raw }`

### fetchCategories(parentId?)

Get category options.

**Returns:** `{ categories, facets, raw }`

### getListingDetails(urlOrPath)

Fetch details from a listing page.

**Returns:** `{ url, description, priceDisplay, images, structuredData, contentLength }`

## Notes

- Prices are in **euro cents** (€15,000 = 1500000)
- Results include full clickable URLs
- Use `--json` to explore all available facets and filter options
- Filter hints are shown after each search

## Testing

```bash
npm test
```

## License

MIT
