---
name: rest-to-graphql
description: Convert REST API routes to a GraphQL schema. Use when migrating APIs or adding a GraphQL layer.
---

# REST to GraphQL Converter

Got a REST API and want GraphQL? Point this at your routes and get a complete schema with types, queries, and mutations. No manual translation required.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-rest-to-graphql ./src/routes
```

## What It Does

- Analyzes your REST endpoints and generates equivalent GraphQL schema
- Converts CRUD operations to queries and mutations
- Generates TypeScript types alongside the schema
- Maps REST resources to GraphQL types with proper relationships
- Includes resolver stubs that call your existing REST handlers

## Usage Examples

```bash
# Convert routes directory
npx ai-rest-to-graphql ./src/routes

# Single resource
npx ai-rest-to-graphql ./src/routes/users.ts

# Include resolver implementations
npx ai-rest-to-graphql ./src/routes --with-resolvers

# Output to specific file
npx ai-rest-to-graphql ./src/routes -o ./schema.graphql

# Keep REST as datasource
npx ai-rest-to-graphql ./src/routes --wrap-rest
```

## Best Practices

- **Start with core resources** - Don't convert everything at once
- **Review the generated types** - AI maps fields but check the relationships
- **Use as a migration guide** - The output shows you the GraphQL equivalent
- **Consider a gateway approach** - Wrap REST with GraphQL instead of replacing

## When to Use This

- Adding GraphQL to an existing REST API
- Exploring what your API would look like in GraphQL
- Building a BFF layer over microservices
- Learning GraphQL by seeing your own data modeled

## Part of the LXGIC Dev Toolkit

This is one of 110+ free developer tools built by LXGIC Studios. No paywalls, no sign-ups, no API keys on free tiers. Just tools that work.

**Find more:**
- GitHub: https://github.com/LXGIC-Studios
- Twitter: https://x.com/lxgicstudios
- Substack: https://lxgicstudios.substack.com
- Website: https://lxgic.dev

## Requirements

No install needed. Just run with npx. Node.js 18+ recommended.

```bash
npx ai-rest-to-graphql --help
```

## How It Works

The tool parses your REST route definitions to understand your resources and operations. It maps GET endpoints to queries, POST/PUT/DELETE to mutations, and infers type structures from your request/response patterns.

## License

MIT. Free forever. Use it however you want.
