---
name: dark-mode-gen
description: Add dark mode support to components. Use when implementing dark theme.
---

# Dark Mode Generator

Adding dark mode means updating every component with CSS variables or Tailwind dark: prefixes. This tool does it automatically for single files or entire directories.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-dark-mode ./src/components/Card.tsx
```

## What It Does

- Adds dark mode styles to React components
- Works with CSS variables, Tailwind, or styled-components
- Handles prefers-color-scheme media queries
- Preserves existing styles and structure

## Usage Examples

```bash
# Single component
npx ai-dark-mode ./src/components/Card.tsx

# Entire directory
npx ai-dark-mode ./src/components/

# Preview before writing
npx ai-dark-mode ./src/components/Card.tsx --dry-run
```

## Best Practices

- **Use CSS variables** - easier to maintain than hardcoded colors
- **Test both modes** - make sure contrast is good in both
- **Don't forget images** - some graphics need light/dark variants
- **Respect system preference** - use prefers-color-scheme

## When to Use This

- Adding dark mode to an existing project
- Converting components that only have light styles
- Standardizing dark mode implementation across files
- Quick prototyping with dark mode support

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
npx ai-dark-mode --help
```

## How It Works

Reads your component files, identifies color definitions and styles, then adds appropriate dark mode variants. For Tailwind it adds dark: prefixes. For CSS it uses CSS variables with prefers-color-scheme.

## License

MIT. Free forever. Use it however you want.
