---
name: env-sync
description: Generate .env.example from your .env files. Use when onboarding developers.
---

# Env Sync

Your .env has 30 variables and nobody knows what half of them do. This tool creates a properly documented .env.example with secrets stripped out.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-env-sync
```

## What It Does

- Reads all your .env files (.env, .env.local, .env.development)
- Strips secret values but keeps the keys
- Adds helpful comments explaining each variable
- Generates a clean .env.example

## Usage Examples

```bash
# Generate .env.example
npx ai-env-sync

# Specify project directory
npx ai-env-sync ./my-project
```

## Best Practices

- **Run before committing** - keep .env.example in sync
- **Add to CI** - verify .env.example matches .env structure
- **Group related vars** - makes it easier to configure
- **Document required vs optional** - not everything needs a value

## When to Use This

- Onboarding new team members
- Setting up CI/CD environments
- Documenting environment requirements
- Keeping .env.example up to date

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
npx ai-env-sync --help
```

## How It Works

Reads your .env files, identifies the variables, and uses GPT-4o-mini to generate helpful descriptions for each one. Sensitive values are replaced with placeholder text like "your_api_key_here".

## License

MIT. Free forever. Use it however you want.
