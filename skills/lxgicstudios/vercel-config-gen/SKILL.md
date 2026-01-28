---
name: vercel-config-gen
description: Generate optimized Vercel configuration. Use when deploying to Vercel.
---

# Vercel Config Generator

Vercel has lots of config options. This generates an optimized vercel.json for your project.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-vercel-config
```

## What It Does

- Analyzes your project
- Generates vercel.json configuration
- Sets up headers, rewrites, and redirects
- Configures build settings

## Usage Examples

```bash
# Generate config
npx ai-vercel-config
```

## Best Practices

- **Set security headers** - HTTPS, CSP, etc.
- **Configure caching** - static assets should cache
- **Use rewrites for SPAs** - handle client-side routing
- **Set function regions** - closer to your users

## When to Use This

- First Vercel deployment
- Optimizing existing deployment
- Adding custom headers
- Setting up redirects

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
npx ai-vercel-config --help
```

## How It Works

Reads your project structure and package.json to understand what you're deploying. Then generates a vercel.json with appropriate settings for your framework.

## License

MIT. Free forever. Use it however you want.
