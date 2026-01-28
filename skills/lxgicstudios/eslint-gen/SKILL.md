---
name: eslint-gen
description: Generate ESLint config from your codebase patterns. Use when setting up linting.
---

# ESLint Config Generator

Stop copying ESLint configs from other projects. This tool scans your actual codebase and generates a config that matches how you already write code.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-eslint-config .
```

## What It Does

- Scans your existing code to detect patterns and conventions
- Generates .eslintrc that matches your actual style
- Handles TypeScript, React, Vue, and Node.js projects
- Sets up proper parser and plugin configurations
- Avoids rules that would flag your existing code

## Usage Examples

```bash
# Analyze and generate for current project
npx ai-eslint-config .

# Generate strict config
npx ai-eslint-config . --strict

# Output to specific file
npx ai-eslint-config . -o .eslintrc.json
```

## Best Practices

- **Run on clean code first** - Generate config after your codebase is in a good state
- **Review the rules** - AI picks sensible defaults but you know your team's preferences
- **Extend don't override** - Use extends for shared configs, customize only what you need
- **Add incrementally** - Start lenient, tighten rules over time

## When to Use This

- Starting a new project and need linting fast
- Standardizing code style across a team
- Migrating from TSLint or other deprecated linters
- Learning ESLint rules through real examples

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
npx ai-eslint-config --help
```

## How It Works

The tool uses glob patterns to find source files, analyzes code style patterns like semicolons, quotes, and spacing, then generates an ESLint config that codifies those patterns into enforceable rules.

## License

MIT. Free forever. Use it however you want.
