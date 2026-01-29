---
name: responsive-fix
description: Make components responsive with proper breakpoints
---

# Responsive Fixer

Paste your desktop-only component, get mobile-responsive code back.

## Quick Start

```bash
npx ai-responsive ./src/components/Dashboard.tsx
```

## What It Does

- Analyzes layout structure
- Adds proper breakpoints
- Converts fixed widths to responsive
- Handles grid/flex adjustments
- Adds mobile-first styles

## Usage Examples

```bash
# Fix a component
npx ai-responsive ./src/components/Sidebar.tsx

# Specify breakpoints
npx ai-responsive ./components/Nav.tsx --breakpoints sm,md,lg

# CSS-in-JS output
npx ai-responsive ./components/Card.tsx --format styled
```

## What It Fixes

- Fixed pixel widths → responsive units
- Desktop grids → mobile stacks
- Hidden mobile elements → proper show/hide
- Touch targets → 48px minimum
- Font sizes → responsive scaling

## Output Example

```tsx
// Before: grid-cols-4
// After: grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
```

## Requirements

Node.js 18+. OPENAI_API_KEY required.

## License

MIT. Free forever.

---

**Built by LXGIC Studios**

- GitHub: [github.com/lxgicstudios/ai-responsive](https://github.com/lxgicstudios/ai-responsive)
- Twitter: [@lxgicstudios](https://x.com/lxgicstudios)
