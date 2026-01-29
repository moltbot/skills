---
name: prisma-gen
description: Generate Prisma schema from plain English. Use when starting a database schema.
---

# Prisma Generator

Designing database schemas means thinking about relations, indexes, and constraints. Describe your data and get a complete Prisma schema.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-prisma-gen "e-commerce with users, products, and orders"
```

## What It Does

- Generates complete Prisma schema from descriptions
- Sets up proper relations and constraints
- Includes common fields (createdAt, updatedAt)
- Handles enums and indexes

## Usage Examples

```bash
# E-commerce schema
npx ai-prisma-gen "e-commerce with users, products, orders"

# SaaS schema
npx ai-prisma-gen "SaaS with organizations, users, and subscriptions"

# Social app
npx ai-prisma-gen "social app with users, posts, likes, and follows"
```

## Best Practices

- **Use relations** - let Prisma handle joins
- **Add indexes** - for frequently queried fields
- **Consider soft deletes** - deletedAt instead of actual delete
- **Review and refine** - AI gets 80%, you add the rest

## When to Use This

- Starting a new database design
- Learning Prisma schema syntax
- Rapid prototyping
- Getting a baseline to customize

## Part of the LXGIC Dev Toolkit

This is one of 110+ free developer tools built by LXGIC Studios. No paywalls, no sign-ups, no API keys on free tiers. Just tools that work.

**Find more:**
- GitHub: https://github.com/LXGIC-Studios
- Twitter: https://x.com/lxgicstudios
- Substack: https://lxgicstudios.substack.com
- Website: https://lxgicstudios.com

## Requirements

No install needed. Just run with npx. Node.js 18+ recommended. Needs OPENAI_API_KEY environment variable.

```bash
npx ai-prisma-gen --help
```

## How It Works

Takes your plain English description of data models and relationships, then generates valid Prisma schema syntax with proper types, relations, and indexes.

## License

MIT. Free forever. Use it however you want.
