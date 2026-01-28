# XSS Scanner

Detect cross-site scripting vulnerabilities in your frontend code before they ship.

## Quick Start

```bash
npx ai-xss-check
```

## What It Does

- Scans JavaScript/TypeScript for XSS vulnerabilities
- Detects unsafe innerHTML, eval, and DOM manipulation
- Identifies unescaped user input in templates
- Checks React dangerouslySetInnerHTML usage
- Provides fix suggestions for each finding

## Usage

```bash
# Scan current directory
npx ai-xss-check

# Scan specific files
npx ai-xss-check ./src/components
```

## When to Use

- Before security audits
- Reviewing third-party code
- Setting up CI security gates
- Training junior devs on XSS prevention

## Part of the LXGIC Dev Toolkit

One of 110+ free developer tools from LXGIC Studios. No paywalls, no sign-ups.

**Find more:**
- GitHub: https://github.com/lxgic-studios
- Twitter: https://x.com/lxgicstudios
- Substack: https://lxgicstudios.substack.com
- Website: https://lxgicstudios.com

## License

MIT. Free forever.
