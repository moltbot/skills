---
name: error-handler-gen
description: Generate error handling middleware for any framework. Use when setting up API error handling.
---

# Error Handler Generator

Good error handling means custom error classes, proper status codes, and consistent response shapes. This tool generates all of it for your framework.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-error-handler express
```

## What It Does

- Generates error middleware for your framework
- Creates custom error classes (NotFoundError, ValidationError, etc.)
- Includes async wrapper to catch promise rejections
- Sets up proper HTTP status codes

## Usage Examples

```bash
# Express middleware
npx ai-error-handler express

# Fastify in JavaScript
npx ai-error-handler fastify -l javascript

# Next.js API routes
npx ai-error-handler nextjs -o lib/errors.ts

# Koa
npx ai-error-handler koa
```

## Best Practices

- **Don't leak stack traces** - only show them in development
- **Log errors server-side** - you need them for debugging
- **Use error codes** - clients can handle specific codes
- **Be consistent** - same error shape everywhere

## When to Use This

- Starting a new API project
- Standardizing error handling across routes
- Adding proper error responses to a messy codebase
- Setting up error monitoring

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
npx ai-error-handler --help
```

## How It Works

Generates framework-specific error handling code including custom error classes, middleware, and async wrappers. The output follows best practices for each framework.

## License

MIT. Free forever. Use it however you want.
