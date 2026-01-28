---
name: tsconfig-gen
description: Generate optimal tsconfig.json for your project type. Use when setting up TypeScript.
---

# TSConfig Generator

Get the right tsconfig for your project without reading docs. Tell it what you're building and get a properly configured TypeScript setup.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-tsconfig "next.js app with strict mode"
```

## What It Does

- Generates tsconfig.json tailored to your project type
- Sets correct module resolution and target for your runtime
- Configures path aliases and includes/excludes
- Enables appropriate strict mode options
- Handles library, app, and monorepo configurations

## Usage Examples

```bash
# Next.js project
npx ai-tsconfig "next.js 14 app router"

# Node.js library
npx ai-tsconfig "node library targeting esm and cjs"

# React app with Vite
npx ai-tsconfig "react spa with vite, strict mode"
```

## Best Practices

- **Match your target** - Node 18+ can use esnext, older runtimes need downleveling
- **Enable strict gradually** - Start with strict:false if migrating from JS
- **Use project references** - For monorepos, generate configs per package
- **Keep paths simple** - Alias @/ to src/ and call it a day

## When to Use This

- Starting any TypeScript project
- Upgrading an existing tsconfig to modern settings
- Understanding what each compiler option actually does
- Setting up build configurations for publishing packages

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
npx ai-tsconfig --help
```

## How It Works

The tool maps your project description to TypeScript compiler options. It knows which settings work together and avoids incompatible combinations. Output is valid JSON with inline comments explaining each option.

## License

MIT. Free forever. Use it however you want.
