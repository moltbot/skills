---
name: nginx-gen
description: Generate nginx config from plain English. Use when configuring nginx.
---

# Nginx Generator

Stop googling nginx config snippets. Describe what you want and get a working nginx configuration.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-nginx "reverse proxy port 3000 with SSL"
```

## What It Does

- Generates complete nginx configuration
- Handles reverse proxy, SSL, caching, rate limiting
- Includes security headers
- Proper server block structure

## Usage Examples

```bash
# Reverse proxy with SSL
npx ai-nginx "reverse proxy port 3000 with SSL and rate limiting"

# Static site
npx ai-nginx "serve static files from /var/www/html with caching"

# Load balancing
npx ai-nginx "load balance between 3 node servers" -o nginx.conf
```

## Best Practices

- **Always use SSL** - Let's Encrypt is free
- **Set worker connections** - tune for your traffic
- **Enable gzip** - compress text responses
- **Add security headers** - prevent common attacks

## When to Use This

- Setting up new nginx server
- Adding reverse proxy to existing setup
- Configuring SSL termination
- Learning nginx configuration

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
npx ai-nginx --help
```

## How It Works

Takes your plain English description and generates complete nginx configuration. The AI knows nginx syntax and best practices for common patterns like reverse proxy, SSL, and caching.

## License

MIT. Free forever. Use it however you want.
