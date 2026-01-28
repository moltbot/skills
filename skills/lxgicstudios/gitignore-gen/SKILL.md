---
name: gitignore-gen
description: Generate .gitignore by analyzing your project. Use when setting up a new repo.
---

# Gitignore Generator

Stop copy-pasting .gitignore templates. This tool scans your project and generates one that actually matches what you're using.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-gitignore
```

## What It Does

- Scans your project for languages and frameworks
- Generates a complete .gitignore
- Includes IDE files, build outputs, and secrets
- No generic templates, just what you need

## Usage Examples

```bash
# Preview what it'll generate
npx ai-gitignore --preview

# Write the .gitignore
npx ai-gitignore

# Custom output path
npx ai-gitignore --output ./my-project/.gitignore
```

## Best Practices

- **Check build outputs** - make sure dist/build folders are ignored
- **Ignore environment files** - .env, .env.local, etc.
- **IDE settings** - .vscode, .idea, etc.
- **OS files** - .DS_Store, Thumbs.db

## When to Use This

- Starting a new project
- Adding a language/framework to existing project
- .gitignore is a mess and needs cleanup
- Not sure what files your stack generates

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
npx ai-gitignore --help
```

## How It Works

Scans for config files like package.json, Cargo.toml, go.mod, etc. to detect what languages and frameworks you're using. Then generates a .gitignore that covers all the common ignore patterns for your stack.

## License

MIT. Free forever. Use it however you want.
