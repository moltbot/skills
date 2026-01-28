---
name: lazy-load-suggester
description: Identify components that should be lazy loaded. Use when optimizing bundle size.
---

# Lazy Load Suggester

Not everything needs to load on first paint. This tool analyzes your components and tells you which ones should be lazy loaded for better performance.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-lazy-load ./src/
```

## What It Does

- Analyzes your component usage patterns
- Identifies heavy components that load upfront
- Suggests lazy loading candidates
- Provides code examples for implementation

## Usage Examples

```bash
# Analyze all components
npx ai-lazy-load ./src/

# Focus on specific directory
npx ai-lazy-load ./src/components/

# Include pages
npx ai-lazy-load ./src/pages/
```

## Best Practices

- **Lazy load routes** - users don't need all pages at once
- **Heavy components** - modals, charts, editors
- **Below the fold** - content users scroll to
- **Keep critical path small** - load what's visible first

## When to Use This

- Initial bundle is too large
- Time to interactive is slow
- Adding code splitting to existing app
- Optimizing specific user flows

## Part of the LXGIC Dev Toolkit

This is one of 110+ free developer tools built by LXGIC Studios. No paywalls, no sign-ups, no API keys on free tiers. Just tools that work.

**Find more:**
- GitHub: https://github.com/LXGIC-Studios
- Twitter: https://x.com/lxgicstudios
- Substack: https://lxgicstudios.substack.com
- Website: https://lxgic.dev

## Requirements

No install needed. Just run with npx. Node.js 18+ recommended. Needs OPENAI_API_KEY environment variable.

```bash
npx ai-lazy-load --help
```

## How It Works

Scans your components to understand import relationships and component sizes. The AI identifies components that aren't needed immediately and would benefit from lazy loading.

## License

MIT. Free forever. Use it however you want.
