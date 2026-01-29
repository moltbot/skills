---
name: schema-gen
description: Generate database schemas from descriptions
---

# Schema Generator

Describe your data, get a proper database schema. Supports SQL, Prisma, and Drizzle.

## Quick Start

```bash
npx ai-schema "e-commerce with users, products, orders, reviews"
```

## What It Does

- Generates complete database schema
- Adds proper relationships
- Includes indexes for common queries
- Handles timestamps and soft deletes

## Usage Examples

```bash
# Generate SQL schema
npx ai-schema "blog with posts, authors, comments, tags"

# Prisma format
npx ai-schema "saas with teams and members" --format prisma

# Drizzle format
npx ai-schema "inventory system" --format drizzle
```

## Output Formats

- Raw SQL (PostgreSQL, MySQL)
- Prisma schema
- Drizzle schema
- TypeORM entities
- Mongoose models

## Includes

- Primary keys
- Foreign key relationships
- Indexes on common fields
- Timestamps (created/updated)
- Soft delete support
- Enum types where appropriate

## Requirements

Node.js 18+. OPENAI_API_KEY required.

## License

MIT. Free forever.

---

**Built by LXGIC Studios**

- GitHub: [github.com/lxgicstudios/ai-schema](https://github.com/lxgicstudios/ai-schema)
- Twitter: [@lxgicstudios](https://x.com/lxgicstudios)
