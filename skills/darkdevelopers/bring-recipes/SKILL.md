---
name: bring-recipes
description: Use when user wants to browse recipe inspirations from Bring! shopping app. For discovering recipes, viewing recipe details (name, author, type, images), or filtering by tags. Note - cannot import ingredients (API limitation).
---

# Bring! Recipe Browser CLI

## Overview

CLI for browsing Bring! recipe inspirations. **Browse-only tool** - the Bring! Inspirations API does not provide ingredient lists.

## When to Use

**Use this skill when:**
- User wants to discover Bring! recipes
- Browsing recipe inspirations
- Viewing recipe metadata (names, authors, types, images, links)
- Filtering recipes by tags (all, mine)
- Need JSON output of recipes for scripting

**Don't use when:**
- User wants to add ingredients to shopping list (API limitation)
- Managing shopping lists directly
- Need full recipe details with ingredients

## Quick Reference

| Command | Purpose |
|---------|---------|
| `bring-recipes list` | Browse recipe inspirations (default) |
| `bring-recipes filters` | Show available filter tags |
| `bring-recipes list --filter mine` | Show your personal recipes |
| `bring-recipes list --json` | JSON output for scripting |

**Environment variables:**
```bash
export BRING_EMAIL="your@email.com"
export BRING_PASSWORD="yourpassword"
```

## Installation

```bash
cd skills/bring-recipes
npm install
```

## Common Workflows

**Browse all recipes:**
```bash
node index.js list --limit 10
```

**Filter your recipes:**
```bash
node index.js list --filter mine
```

**Get JSON for scripting:**
```bash
node index.js list --json | jq -r '.[] | .content.name'
```

**Check available filters:**
```bash
node index.js filters
```

## Flags Reference

| Flag | Description |
|------|-------------|
| `-f, --filter <tags>` | Filter tags: all, mine |
| `--limit <n>` | Max recipes (default: 10) |
| `--json` | JSON output |
| `--no-color` | Disable colors |
| `-q, --quiet` | Minimal output |
| `-v, --verbose` | Debug output |

## API Limitations

⚠️ **Critical:** The Bring! `getInspirations()` API returns only metadata:
- ✅ Recipe names, authors, types
- ✅ Images, links, tags, like counts
- ❌ **Ingredient lists** (not provided)

This is a Bring! API limitation, not a CLI bug. The CLI is designed for **browsing and discovering** recipes only.

## Recipe Types

- **TEMPLATE** - Bring! templates (e.g., "Sunday Brunch")
- **RECIPE** - Parsed recipes from partners
- **POST** - Promotional content

## Common Mistakes

**Expecting ingredients:**
The API does not provide ingredient lists. Use the CLI for discovery, then manually add items.

**Looking for seasonal filters:**
The API has no seasonal tags. Only "all" and "mine" filters are available.

**Assuming all recipes have names:**
POST types may be "Untitled Recipe" - this is normal API behavior.

## Implementation Notes

- Uses `node-bring-api` v2.0.2+ with `getInspirations()` API
- Requires Node.js 18.0.0+
- No seasonal filtering (API limitation)
- Browse-only functionality
- JSON mode available for automation

## Real-World Use

- **Recipe discovery:** Browse what's available in Bring!
- **Inspiration browsing:** See trending recipes and templates
- **Personal collection:** Filter your saved recipes
- **Integration:** JSON output for external tools
