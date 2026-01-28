---
name: xss-scanner
description: Detect XSS vulnerabilities in your frontend code. Use when you need to find cross-site scripting risks before they ship.
---

# XSS Scanner

Cross-site scripting is still the most common web vulnerability. This tool scans your frontend code for XSS risks, dangerouslySetInnerHTML usage, unsanitized user inputs, and other injection vectors. It tells you exactly where the problems are and how to fix them.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-xss-check src/
```

## What It Does

- Scans JavaScript, TypeScript, and JSX files for XSS vulnerability patterns
- Detects dangerouslySetInnerHTML, innerHTML assignments, and eval usage
- Finds unsanitized user input flowing into DOM manipulation
- Reports severity levels from info to critical
- Provides specific fix suggestions with code examples

## Usage Examples

```bash
# Scan your entire frontend
npx ai-xss-check src/

# Check a specific file
npx ai-xss-check src/components/CommentBox.tsx

# Scan all JavaScript files
npx ai-xss-check "src/**/*.{js,jsx,ts,tsx}"
```

## Best Practices

- **Run on every PR** - XSS vulnerabilities sneak in through seemingly innocent changes
- **Pay attention to user input flows** - Any data from users, URLs, or APIs that touches the DOM is a risk
- **Don't just suppress warnings** - If the tool flags dangerouslySetInnerHTML, there's probably a safer way
- **Combine with CSP headers** - This tool catches code issues. CSP is your runtime safety net.

## When to Use This

- Before a security audit to catch the easy stuff
- After adding any feature that renders user generated content
- When reviewing code from external contributors
- As part of your CI pipeline for continuous security checks

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
npx ai-xss-check --help
```

## How It Works

The tool scans your source files using pattern matching and AST analysis to find common XSS vectors. It identifies dangerous DOM manipulation, unsanitized inputs, and risky API usage. Then an AI model analyzes the context of each finding to reduce false positives and generate targeted fix suggestions.

## License

MIT. Free forever. Use it however you want.