---
name: prefetch-suggester
description: Get AI suggestions for routes and data to prefetch. Use when optimizing navigation.
---

# Prefetch Suggester

Users hate waiting for pages to load. This tool analyzes your routes and suggests what to prefetch for instant navigation.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-prefetch ./src/pages/
```

## What It Does

- Analyzes your page routes and navigation patterns
- Identifies high-probability next pages
- Suggests data to prefetch
- Provides implementation code

## Usage Examples

```bash
# Analyze pages directory
npx ai-prefetch ./src/pages/

# Analyze app routes
npx ai-prefetch ./app/routes/
```

## Best Practices

- **Prefetch on hover** - intent signal before click
- **Don't prefetch everything** - wastes bandwidth
- **Prioritize common paths** - checkout flow, navigation
- **Use intersection observer** - prefetch when in view

## When to Use This

- Navigation feels slow
- Optimizing user flow paths
- Adding prefetching to existing app
- Learning prefetch patterns

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
npx ai-prefetch --help
```

## How It Works

Analyzes your route structure and link patterns to understand likely navigation paths. Then suggests which pages and data to prefetch based on probability and importance.

## License

MIT. Free forever. Use it however you want.
