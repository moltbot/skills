---
name: redis-gen
description: Generate Redis key patterns and data structure designs. Use when planning your Redis architecture.
---

# Redis Gen

Redis is fast but designing key patterns is an art. This tool helps you plan your Redis schema with proper key naming, TTLs, and data structures. Stop guessing whether to use a hash or a sorted set.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-redis-schema "user sessions with activity tracking"
```

## What It Does

- Generates optimal key patterns for your use case
- Recommends the right data structures (strings, hashes, sets, sorted sets, lists)
- Includes TTL recommendations for cache invalidation
- Provides example commands for common operations
- Documents memory considerations

## Usage Examples

```bash
# Design session storage
npx ai-redis-schema "user sessions with last active timestamp"

# Rate limiting schema
npx ai-redis-schema "api rate limiting per user per endpoint"

# Leaderboard design
npx ai-redis-schema "game leaderboard with weekly and all-time scores"

# Real-time features
npx ai-redis-schema "online presence tracking for chat app"
```

## Best Practices

- **Namespace your keys** - Use colons to separate: `user:123:sessions`
- **Include TTLs** - Most Redis data should expire. Don't fill memory forever.
- **Think about scans** - Avoid patterns that require KEYS in production
- **Consider memory** - Hashes are memory-efficient. Strings are not.

## When to Use This

- Starting a new feature that needs Redis caching
- Refactoring existing Redis usage that got messy
- Learning Redis and want to see idiomatic patterns
- Need to document your Redis schema for the team

## Part of the LXGIC Dev Toolkit

This is one of 110+ free developer tools built by LXGIC Studios. No paywalls, no sign-ups, no API keys on free tiers. Just tools that work.

**Find more:**
- GitHub: https://github.com/LXGIC-Studios
- Twitter: https://x.com/lxgicstudios
- Substack: https://lxgicstudios.substack.com
- Website: https://lxgic.dev

## Requirements

No install needed. Just run with npx. Node.js 18+ recommended. Requires OPENAI_API_KEY environment variable.

```bash
export OPENAI_API_KEY=sk-...
npx ai-redis-schema --help
```

## How It Works

Takes your use case description and applies Redis best practices to design an appropriate schema. Considers data access patterns, memory efficiency, and common pitfalls. Outputs a complete schema document with key patterns, data types, and example operations.

## License

MIT. Free forever. Use it however you want.
