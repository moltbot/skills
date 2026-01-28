---
name: cors-gen
description: Generate CORS configuration for your stack. Use when cross-origin requests are blocked.
---

# CORS Generator

CORS errors are the bane of frontend development. Describe your setup and get the exact configuration you need for your stack.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-cors "frontend on localhost:3000, API on localhost:8080"
```

## What It Does

- Generates CORS config for your specific server/framework
- Handles complex setups with multiple origins
- Includes credentials, headers, and method configuration
- Works with Express, Fastify, Next.js, and more

## Usage Examples

```bash
# Local development
npx ai-cors "frontend on localhost:3000, API on localhost:8080"

# Production setup
npx ai-cors "React app on vercel, Express API on Railway"

# Multiple origins
npx ai-cors "allow requests from app.example.com and admin.example.com"

# With credentials
npx ai-cors "frontend on vercel, API on heroku, needs cookies"
```

## Best Practices

- **Be specific about origins** - don't use * in production
- **Allow only needed methods** - GET, POST, not everything
- **Consider credentials** - cookies require specific config
- **Test in incognito** - browser caching can hide issues

## When to Use This

- "CORS blocked" errors in the console
- Setting up a new API endpoint
- Migrating frontend or backend to new domain
- Adding authentication to an existing API

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
npx ai-cors --help
```

## How It Works

Takes your plain English description of your frontend and backend setup, then generates the correct CORS configuration for your server framework. The AI handles the nuances of preflight requests, allowed headers, and credential handling.

## License

MIT. Free forever. Use it however you want.
