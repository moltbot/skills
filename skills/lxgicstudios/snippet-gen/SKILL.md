---
name: snippet-gen
description: Generate VS Code snippets from code patterns. Use when creating editor shortcuts.
---

# Snippet Generator

You type the same patterns over and over. This tool reads your code and generates VS Code snippets for common patterns.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-snippet ./src/
```

## What It Does

- Analyzes your code for repeated patterns
- Generates VS Code snippet definitions
- Includes placeholder variables
- Creates descriptive prefixes

## Usage Examples

```bash
# Analyze source files
npx ai-snippet ./src/

# Component patterns
npx ai-snippet ./lib/components/
```

## Best Practices

- **Focus on repetitive code** - hooks, components, utilities
- **Use good prefixes** - easy to remember
- **Add placeholders** - tab through editable parts
- **Keep them short** - long snippets are hard to remember

## When to Use This

- Speed up repetitive coding
- Share team patterns
- Onboard new developers
- Document coding standards

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
npx ai-snippet --help
```

## How It Works

Scans your codebase for repeated patterns like component structures, hook definitions, and utility functions. Then generates VS Code snippet JSON with proper placeholders.

## License

MIT. Free forever. Use it however you want.
