---
name: shopping-expert
description: Find and compare products online (Google Shopping) and locally (stores near you). Auto-selects best products based on price, ratings, availability, and preferences. Generates shopping list with buy links and store locations. Use when asked to shop for products, find best deals, compare prices, or locate items locally. Supports budget constraints (low/medium/high or "$X"), preference filtering (brand, features, color), and dual-mode search (online + local stores).
homepage: https://github.com/clawdbot/clawdbot
metadata: {"clawdbot":{"emoji":"🛒","requires":{"bins":["uv"],"env":["SERPAPI_API_KEY","GOOGLE_PLACES_API_KEY"]},"primaryEnv":"SERPAPI_API_KEY","install":[{"id":"uv-brew","kind":"brew","formula":"uv","bins":["uv"],"label":"Install uv (brew)"}]}}
---

# Shopping Expert

Find and compare products online and locally with smart recommendations.

## Quick Start

Find products online:

```bash
uv run {baseDir}/scripts/shop.py "coffee maker" \
  --budget medium \
  --max-results 5
```

Search with budget constraint:

```bash
uv run {baseDir}/scripts/shop.py "running shoes" \
  --budget "$100" \
  --preferences "Nike, cushioned, waterproof"
```

Find local stores:

```bash
uv run {baseDir}/scripts/shop.py "Bio Gemüse" \
  --mode local \
  --location "Hamburg, Germany"
```

Hybrid search (online + local):

```bash
uv run {baseDir}/scripts/shop.py "Spiegelreflexkamera" \
  --mode hybrid \
  --location "München, Germany" \
  --budget high \
  --preferences "Canon, 4K Video"
```

Search US stores:

```bash
uv run {baseDir}/scripts/shop.py "running shoes" \
  --country us \
  --budget "$100"
```

## Search Modes

- **online**: E-commerce sites (Amazon, Walmart, etc.) via Google Shopping
- **local**: Nearby stores via Google Places API
- **hybrid**: Both online and local results merged and ranked
- **auto**: Intelligent mode selection based on query (default)

## Parameters

- `query`: Product search query (required)
- `--mode`: Search mode (online|local|hybrid|auto, default: auto)
- `--budget`: "low/medium/high" or "€X"/"$X" amount (default: medium)
- `--location`: Location for local/hybrid searches
- `--preferences`: Comma-separated (e.g., "brand:Sony, wireless, black")
- `--max-results`: Maximum products to return (default: 5, max: 20)
- `--sort-by`: Sort order (relevance|price-low|price-high|rating)
- `--output`: text|json (default: text)
- `--country`: Country code for search (default: de). Use "us" for US, "uk" for UK, etc.

## Budget Levels

- **low**: Under €50
- **medium**: €50-€150
- **high**: Over €150
- **exact**: "€75", "€250" (or "$X" for US searches)

## Output Format

**Default (text)**: Markdown table with product details, ratings, availability, and buy links

**JSON**: Structured data with all product metadata, scores, and links

## Scoring Algorithm

Products are ranked using weighted scoring:
- **Price match (30%)**: Within budget range gets full points
- **Rating (25%)**: Higher ratings score better
- **Availability (20%)**: In stock > limited > out of stock
- **Review count (15%)**: More reviews = more trustworthy
- **Shipping/Distance (10%)**: Free shipping or nearby stores score higher
- **Preference match (bonus)**: Keywords in product description

## API Keys Required

- **SERPAPI_API_KEY**: Required for online shopping (all modes except local-only)
- **GOOGLE_PLACES_API_KEY**: Only required for local and hybrid modes

## Limitations

- **API limits**: SerpAPI and Google Places have usage quotas
- **Real-time data**: Prices and availability may change
- **Stock accuracy**: Online availability reflects last API update
- **Local inventory**: Store stock not guaranteed via Places API

## Error Handling

- Invalid query → Returns error with suggestions
- No results found → Relaxes filters and retries
- API failures → Retry with exponential backoff (3 attempts)
- Missing API keys → Clear error message with setup instructions
