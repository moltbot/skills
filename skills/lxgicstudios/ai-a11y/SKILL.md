---
name: a11y-checker
description: Scan HTML and JSX for accessibility issues with AI-powered fix suggestions
---

# A11y Checker

Scan your HTML and JSX files for WCAG accessibility issues. Get actual code fixes, not just warnings.

**One command. Real fixes. Not just complaints.**

## Quick Start

```bash
npx ai-a11y ./src/components/Header.tsx
```

## What It Does

- Scans HTML/JSX for accessibility violations
- Identifies WCAG guideline failures
- Generates actual fix code, not just warnings
- Works on single files or entire directories

## Usage Examples

```bash
# Scan a single component
npx ai-a11y ./src/components/Button.tsx

# Scan all components
npx ai-a11y ./src/components/

# Scan with verbose output
npx ai-a11y ./src --verbose
```

## Common Issues It Catches

- Missing alt text on images
- Low color contrast
- Missing form labels
- Keyboard navigation problems
- ARIA attribute misuse
- Focus management issues

## When to Use This

- Before launching a new feature
- Audit an inherited codebase
- Prep for accessibility compliance
- CI/CD accessibility gates

## Part of the LXGIC Dev Toolkit

This is one of 110+ free developer tools built by LXGIC Studios. No paywalls, no sign-ups.

**Find more:** https://github.com/LXGIC-Studios

## Requirements

Node.js 18+. Needs OPENAI_API_KEY environment variable.

## License

MIT. Free forever.

---

**Built by LXGIC Studios**

- GitHub: [github.com/lxgicstudios/ai-a11y](https://github.com/lxgicstudios/ai-a11y)
- Twitter: [@lxgicstudios](https://x.com/lxgicstudios)
