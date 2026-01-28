---
name: css-to-tailwind
description: Convert CSS files to Tailwind utility classes. Use when migrating from vanilla CSS to Tailwind.
---

# CSS to Tailwind Converter

Migrating to Tailwind means rewriting hundreds of CSS rules as utility classes. Nobody wants to do that by hand. This tool reads your CSS files and converts them to equivalent Tailwind classes. It handles the tedious conversion so you can focus on the tricky edge cases.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-css-to-tailwind styles.css
```

## What It Does

- Reads CSS files and converts rules to Tailwind utility classes
- Handles common properties like padding, margin, colors, typography, and flexbox
- Preserves your class structure so you can map old classes to new utilities
- Handles media queries by converting to Tailwind responsive prefixes
- Outputs a mapping file showing old CSS to new Tailwind equivalents

## Usage Examples

```bash
npx ai-css-to-tailwind styles.css
npx ai-css-to-tailwind src/styles/
npx ai-css-to-tailwind "src/**/*.css"
```

## Best Practices

- **Convert one file at a time** - Easier to verify the output
- **Check custom values** - Tailwind has specific scales. Custom pixel values might need theme config updates.
- **Keep your old CSS as backup** - Don't delete until you've verified everything works

## When to Use This

- Migrating an existing project to Tailwind
- Converting a component library from CSS to utility classes
- Learning what Tailwind classes correspond to your CSS

## Part of the LXGIC Dev Toolkit

This is one of 110+ free developer tools built by LXGIC Studios. No paywalls, no sign-ups, no API keys on free tiers. Just tools that work.

**Find more:**
- GitHub: https://github.com/LXGIC-Studios
- Twitter: https://x.com/lxgicstudios
- Substack: https://lxgicstudios.substack.com
- Website: https://lxgic.dev

## Requirements

No install needed. Just run with npx. Node.js 18+ recommended.

## How It Works

Parses your CSS files and maps each property-value pair to the closest Tailwind utility class. AI handles ambiguous conversions and custom values that don't have direct Tailwind equivalents.

## License

MIT. Free forever. Use it however you want.