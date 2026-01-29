---
name: onboard-gen
description: Generate onboarding documentation for new developers. Use when improving dev experience.
---

# Onboard Generator

New developers join and have no idea how to get started. This tool scans your project and generates a complete onboarding guide.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-onboard
```

## What It Does

- Scans your project structure and config
- Generates setup instructions
- Documents environment variables needed
- Explains architecture and conventions

## Usage Examples

```bash
# Generate onboarding docs
cd my-project
npx ai-onboard

# Custom output
npx ai-onboard -o ONBOARDING.md
```

## Best Practices

- **Keep it updated** - run when setup changes
- **Include troubleshooting** - common issues and fixes
- **List dependencies** - what needs to be installed
- **Add architecture overview** - big picture context

## When to Use This

- New team members joining frequently
- Developer experience needs improvement
- README is outdated or missing
- Reducing onboarding friction

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
npx ai-onboard --help
```

## How It Works

Analyzes your project's package.json, scripts, environment files, and folder structure. Then generates a comprehensive onboarding document with step-by-step setup instructions.

## License

MIT. Free forever. Use it however you want.
