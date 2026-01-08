---
name: paprika
description: Access recipes, meal plans, and grocery lists from Paprika Recipe Manager. Use when user asks about recipes, meal planning, or cooking.
homepage: https://www.paprikaapp.com
metadata:
  clawdbot:
    emoji: "📖"
    requires:
      bins: ["paprika"]
---

# Paprika Recipe CLI

CLI for Paprika Recipe Manager. Access recipes, meal plans, and grocery lists.

## Installation

```bash
npm install -g paprika-recipe-cli
```

## Setup

```bash
# Authenticate interactively
paprika auth

# Or set environment variables
export PAPRIKA_EMAIL="your@email.com"
export PAPRIKA_PASSWORD="your-password"
```

## Commands

### Recipes

```bash
paprika recipes                       # List all recipes
paprika recipes --category "Dinner"   # Filter by category
paprika recipes --json

paprika recipe "Pasta Carbonara"      # View by name
paprika recipe <uid>                  # View by UID
paprika recipe "Pasta" --ingredients-only
paprika recipe "Pasta" --json

paprika search "chicken"              # Search recipes
```

### Meal Planning

```bash
paprika meals                         # Show all planned meals
paprika meals --date 2026-01-08       # Filter by date
paprika meals --json
```

### Groceries

```bash
paprika groceries                     # Show unpurchased items
paprika groceries --all               # Include purchased
paprika groceries --json
```

### Categories

```bash
paprika categories                    # List all categories
```

## Usage Examples

**User: "What recipes do I have for dinner?"**
```bash
paprika recipes --category "Dinner"
```

**User: "Show me the pasta carbonara recipe"**
```bash
paprika recipe "Pasta Carbonara"
```

**User: "What ingredients do I need for lasagna?"**
```bash
paprika recipe "Lasagna" --ingredients-only
```

**User: "What's on the meal plan?"**
```bash
paprika meals
```

**User: "What's on my grocery list?"**
```bash
paprika groceries
```

**User: "Find chicken recipes"**
```bash
paprika search "chicken"
```

## Notes

- Recipe names support partial matching
- Use `--json` for programmatic access
- Requires Paprika cloud sync to be enabled
