---
name: lazy-loader
description: Identify components that should be lazy loaded using AI. Use when optimizing bundle size and initial load.
---

# Lazy Load Analyzer

Your bundle is huge and your initial load is slow. This tool finds components that should be dynamically imported and tells you exactly how to split them. Stop shipping the entire app on first load.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-lazy-load ./src
```

## What It Does

- Analyzes your component tree for lazy loading opportunities
- Identifies below-the-fold components that don't need immediate loading
- Finds route-based splits for Next.js and React Router
- Suggests React.lazy() implementations with Suspense boundaries
- Estimates bundle size impact for each suggestion

## Usage Examples

```bash
# Analyze all components
npx ai-lazy-load ./src/components

# Focus on pages/routes
npx ai-lazy-load ./src/pages --routes-only

# Show bundle impact estimates
npx ai-lazy-load ./src --with-sizes

# Generate ready-to-use code
npx ai-lazy-load ./src --generate-code

# Next.js specific analysis
npx ai-lazy-load ./src --framework next
```

## Best Practices

- **Don't lazy load everything** - Above-the-fold components should load immediately
- **Group related components** - Lazy load a feature module, not individual buttons
- **Add proper loading states** - Every Suspense boundary needs a fallback
- **Measure the difference** - Check your bundle analyzer before and after

## When to Use This

- Initial bundle size is over 200KB gzipped
- Lighthouse says "reduce unused JavaScript"
- Adding features and worried about bloat
- Refactoring an app to improve TTI

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
npx ai-lazy-load --help
```

## How It Works

The tool parses your component imports and builds a dependency graph. It identifies components that are conditionally rendered, below viewport, or behind user interactions. AI evaluates which splits give you the best performance gains with minimal complexity.

## License

MIT. Free forever. Use it however you want.
