---
name: secret-scanner
description: Scan your codebase for leaked secrets and API keys. Use when you need a security check before pushing.
---

# Secret Scanner

Pushing an API key to a public repo is the kind of mistake that ruins your whole week. This tool scans your codebase for leaked secrets, API keys, tokens, and credentials before they end up somewhere they shouldn't. It pattern-matches first, then optionally runs AI analysis to catch the sneaky ones that regex misses.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-secret-scan
```

## What It Does

- Scans directories recursively for hardcoded secrets, API keys, and tokens
- Uses pattern matching to catch common secret formats (AWS keys, JWT tokens, database URLs)
- Runs optional AI analysis to identify secrets that don't match standard patterns
- Reports file paths, line numbers, and code snippets for every finding
- Works on any codebase without configuration

## Usage Examples

```bash
# Scan current directory
npx ai-secret-scan

# Scan a specific project
npx ai-secret-scan ./my-project

# Pattern match only, skip AI analysis
npx ai-secret-scan --no-ai
```

## Best Practices

- **Run before every push** - Make this part of your pre-commit routine. It takes seconds and can save you from a public key leak.
- **Don't ignore warnings** - Even if a finding looks like a false positive, check it. Better safe than rotating every key you own.
- **Use .env files** - If the scanner finds secrets in your source code, move them to .env and add it to .gitignore.
- **Check old commits too** - Removing a secret from code doesn't remove it from git history. If it was ever committed, rotate it.
- **Combine with gitignore** - Make sure .env, credentials files, and key stores are in your .gitignore before scanning.

## When to Use This

- Before pushing code to any remote repository
- During code review to verify no secrets leaked in
- When onboarding onto a new codebase to check for existing leaks
- As part of CI/CD pipeline security checks

## How It Works

The scanner walks your project directory and checks every file against a library of regex patterns for common secret formats. Things like AWS access keys, database connection strings, and JWT tokens. For anything that looks suspicious but doesn't match a known pattern, the optional AI analysis step takes a closer look.

## Requirements

No install needed. Just run with npx. Node.js 18+ recommended.

```bash
npx ai-secret-scan --help
```

## Part of the LXGIC Dev Toolkit

This is one of 110+ free developer tools built by LXGIC Studios. No paywalls, no sign-ups, no API keys on free tiers. Just tools that work.

**Find more:**
- GitHub: https://github.com/LXGIC-Studios
- Twitter: https://x.com/lxgicstudios
- Substack: https://lxgicstudios.substack.com
- Website: https://lxgic.dev

## License

MIT. Free forever. Use it however you want.