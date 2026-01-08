---
name: anylist
description: Manage grocery and shopping lists via AnyList. Use when user asks about shopping lists, groceries, or adding/checking off items to buy.
homepage: https://www.anylist.com
metadata:
  clawdbot:
    emoji: "🛒"
    requires:
      bins: ["anylist"]
---

# AnyList CLI

Manage grocery and shopping lists via AnyList.

## Installation

```bash
npm install -g anylist-cli
```

## Setup

```bash
# Authenticate interactively
anylist auth

# Or set environment variables for non-interactive use
export ANYLIST_EMAIL="your@email.com"
export ANYLIST_PASSWORD="your-password"
```

## Commands

### Lists

```bash
anylist lists              # Show all lists
anylist lists --json       # Output as JSON
```

### Items

```bash
anylist items "Grocery"              # Show items in a list
anylist items "Grocery" --unchecked  # Only unchecked items
anylist items "Grocery" --json       # Output as JSON
```

### Add Items

```bash
anylist add "Grocery" "Milk"
anylist add "Grocery" "Milk" --category dairy
anylist add "Grocery" "Chicken" --category meat --quantity "2 lbs"
```

**Categories:** produce, meat, seafood, dairy, bakery, bread, frozen, canned, condiments, beverages, snacks, pasta, rice, cereal, breakfast, baking, spices, seasonings, household, personal care, other

### Manage Items

```bash
anylist check "Grocery" "Milk"      # Mark as checked
anylist uncheck "Grocery" "Milk"    # Mark as unchecked
anylist remove "Grocery" "Milk"     # Remove from list
anylist clear "Grocery"             # Clear all checked items
```

## Usage Examples

**User: "What's on the grocery list?"**
```bash
anylist items "Grocery" --unchecked
```

**User: "Add milk and eggs to groceries"**
```bash
anylist add "Grocery" "Milk" --category dairy
anylist add "Grocery" "Eggs" --category dairy
```

**User: "Check off the bread"**
```bash
anylist check "Grocery" "Bread"
```

**User: "Add ingredients for tacos"**
```bash
anylist add "Grocery" "Ground beef" --category meat
anylist add "Grocery" "Taco shells" --category other
anylist add "Grocery" "Lettuce" --category produce
anylist add "Grocery" "Tomatoes" --category produce
anylist add "Grocery" "Cheese" --category dairy
```

## Notes

- List and item names are case-insensitive
- If an item already exists, adding it again will uncheck it (useful for recipes)
- Use `--json` for scripting and programmatic access
