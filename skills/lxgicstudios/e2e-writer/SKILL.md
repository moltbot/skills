---
name: e2e-writer
description: Generate Playwright end-to-end tests from a URL or component file. Use when you need e2e test coverage fast.
---

# E2E Test Writer

Writing end-to-end tests is the thing everyone knows they should do but nobody wants to. This tool generates Playwright e2e tests by looking at your URL or component files. Point it at a page and it figures out the user flows, selectors, and assertions for you.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-e2e-gen src/pages/Login.tsx
```

## What It Does

- Analyzes your component or page to identify testable user flows
- Generates complete Playwright test files with proper selectors
- Handles form submissions, navigation, and async operations
- Creates both happy path and error case tests
- Outputs ready to run .spec.ts files

## Usage Examples

```bash
# Generate tests for a login page component
npx ai-e2e-gen src/pages/Login.tsx

# Generate tests from a URL
npx ai-e2e-gen https://myapp.com/signup

# Generate tests for multiple components
npx ai-e2e-gen src/pages/*.tsx
```

## Best Practices

- **Start with your most critical flows** - Login, signup, checkout. The stuff that actually breaks in production.
- **Review the selectors** - The generated selectors are good starting points but you might want to add data-testid attributes for stability
- **Run them immediately** - Don't let generated tests sit. Run them right away to catch any issues with the output
- **Add to CI early** - Get these into your pipeline before you forget

## When to Use This

- You're adding e2e tests to a project that has zero coverage
- A new feature shipped and you need tests before the next sprint
- You want a baseline test suite to catch regressions
- QA is overwhelmed and you need automated coverage now

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
npx ai-e2e-gen --help
```

## How It Works

The tool reads your component source code or fetches a URL, then analyzes the DOM structure and user interactions. It sends this context to an AI model that generates Playwright test cases covering the main user flows, edge cases, and error states.

## License

MIT. Free forever. Use it however you want.