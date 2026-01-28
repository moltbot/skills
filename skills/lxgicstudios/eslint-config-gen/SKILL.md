---
name: eslint-config-gen
description: Generate ESLint config that matches your code style. Use when setting up linting.
---

# ESLint Config Generator

Every team argues about eslint rules. This tool reads your actual code and generates a config that matches how you already write.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-eslint-config
```

## What It Does

- Analyzes your existing code style
- Generates ESLint config matching those patterns
- Supports flat config and legacy formats
- No more arguing about semicolons

## Usage Examples

```bash
# Generate eslint.config.js
npx ai-eslint-config

# Legacy .eslintrc.json format
npx ai-eslint-config --format json

# Analyze specific directory
npx ai-eslint-config --dir ./src
```

## Best Practices

- **Run on representative code** - not just one file
- **Review the rules** - might catch some bad habits too
- **Add prettier if needed** - don't mix formatting with linting
- **Commit the config** - everyone uses the same rules

## When to Use This

- Starting a new project and need eslint setup
- Inheriting a project with no linting
- Want to codify existing code style
- Migrating to flat config format

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
npx ai-eslint-config --help
```

## How It Works

Reads sample files from your codebase, identifies patterns like semicolon usage, quote style, and indentation. Then generates an ESLint config that enforces those patterns.

## License

MIT. Free forever. Use it however you want.
