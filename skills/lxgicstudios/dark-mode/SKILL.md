---
name: dark-mode
description: Add dark mode support to components using AI. Use when building theme toggles or retrofitting dark mode.
---

# Dark Mode Generator

Tired of manually writing dark mode variants? This tool scans your components and generates the CSS or Tailwind classes you need. Point it at a file, get dark mode support back. No overthinking required.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-dark-mode ./src/components/Button.tsx
```

## What It Does

- Analyzes your component's existing styles and color usage
- Generates matching dark mode variants that actually look good
- Works with plain CSS, Tailwind, or CSS-in-JS
- Outputs clean, copy-paste ready code
- Respects your existing design system colors

## Usage Examples

```bash
# Generate dark mode for a single component
npx ai-dark-mode ./src/components/Card.tsx

# Process an entire directory
npx ai-dark-mode ./src/components/ --recursive

# Output Tailwind dark: classes
npx ai-dark-mode ./src/Button.tsx --format tailwind

# Generate CSS custom properties
npx ai-dark-mode ./src/styles/main.css --format css-vars
```

## Best Practices

- **Start with your design tokens** - If you have a color palette defined, the AI will reference it for consistent results
- **Review contrast ratios** - The tool tries to maintain readability but always double check accessibility
- **Test in both modes** - Generated styles are smart but not perfect. Toggle between modes to catch edge cases
- **Keep backgrounds in mind** - Dark mode isn't just inverting colors. Think about elevation and depth

## When to Use This

- You inherited a codebase with no dark mode and need to add it fast
- Building a new component and want dark variants from the start
- Converting a design system to support theme switching
- Quick prototyping where you want both modes without manual work

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
npx ai-dark-mode --help
```

## How It Works

The tool parses your component file, extracts color values and style definitions, then uses AI to generate semantically appropriate dark mode alternatives. It understands that light backgrounds become dark, text colors flip for contrast, and subtle grays need careful adjustment.

## License

MIT. Free forever. Use it however you want.
