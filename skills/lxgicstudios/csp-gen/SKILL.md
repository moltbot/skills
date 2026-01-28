---
name: csp-gen
description: Generate Content Security Policy headers for your site. Use when you need to add CSP headers without spending hours reading the spec.
---

# CSP Generator

Content Security Policy headers are one of the best defenses against XSS attacks. But writing them is confusing. This tool analyzes your site and generates the right CSP headers automatically. No more guessing which directives you need or accidentally blocking your own scripts.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-csp https://mysite.com
```

## What It Does

- Analyzes your site to determine which resources are loaded and from where
- Generates a complete Content-Security-Policy header string
- Handles script-src, style-src, img-src, connect-src, and all other directives
- Suggests report-uri configuration for monitoring violations
- Outputs both strict and relaxed policy options

## Usage Examples

```bash
# Generate CSP for a production site
npx ai-csp https://mysite.com

# Generate CSP for local development
npx ai-csp http://localhost:3000

# Analyze a specific page
npx ai-csp https://mysite.com/dashboard
```

## Best Practices

- **Start with report-only mode** - Deploy with Content-Security-Policy-Report-Only first to see what would break
- **Avoid unsafe-inline** - If your CSP has unsafe-inline in script-src, it's barely doing anything
- **Use nonces for inline scripts** - Much safer than unsafe-inline and works with most frameworks
- **Test on all pages** - Different pages might load different resources. Generate and merge policies.

## When to Use This

- You're adding CSP headers for the first time and don't know where to start
- Your current CSP is too loose and you want to tighten it
- You added new third party scripts and need to update your policy
- Security audit flagged missing or weak CSP headers

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
npx ai-csp --help
```

## How It Works

The tool analyzes your site's resources by checking which scripts, styles, images, and APIs are loaded. It maps these to the appropriate CSP directives and generates a complete policy string. AI is used to recommend the right balance between security and functionality.

## License

MIT. Free forever. Use it however you want.