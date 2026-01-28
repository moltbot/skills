---
name: web-qa-bot
description: AI-powered web application QA automation using accessibility-tree based testing. Smoke tests, test suites, and PDF reports.
version: 0.1.0
---

# web-qa-bot

AI-powered web application QA automation using accessibility-tree based testing.

## Overview

This skill provides tools for automated QA testing of web applications. It uses browser accessibility trees for reliable element detection instead of fragile CSS selectors.

## Installation

```bash
npm install -g web-qa-bot agent-browser
agent-browser install
```

## Commands

### Quick Smoke Test

```bash
web-qa-bot smoke https://example.com
```

Runs basic health checks:
- Page loads successfully
- No console errors
- Navigation elements present
- Images have alt text

### Run Test Suite

```bash
web-qa-bot run ./tests/suite.yaml --output report.md
```

### Generate PDF Report

```bash
web-qa-bot report ./results.json -o report.pdf -f pdf
```

## Use Cases

### 1. Quick Site Health Check

```bash
# Smoke test a production URL
web-qa-bot smoke https://app.example.com --checks pageLoad,consoleErrors,navigation
```

### 2. Pre-deployment QA

Create a test suite and run before each deployment:

```yaml
# tests/critical-paths.yaml
name: Critical Paths
baseUrl: https://staging.example.com

tests:
  - name: Login flow
    steps:
      - goto: /login
      - type: { ref: Email, text: test@example.com }
      - type: { ref: Password, text: testpass }
      - click: Sign In
      - expectVisible: Dashboard
      - expectNoErrors: true
```

```bash
web-qa-bot run ./tests/critical-paths.yaml --output qa-report.pdf -f pdf
```

### 3. Monitor for Regressions

```bash
# Run tests and fail CI if issues found
web-qa-bot run ./tests/smoke.yaml || exit 1
```

### 4. Programmatic Testing

```typescript
import { QABot } from 'web-qa-bot'

const qa = new QABot({
  baseUrl: 'https://example.com',
  headless: true
})

await qa.goto('/')
await qa.click('Get Started')
await qa.snapshot()
qa.expectVisible('Sign Up')
await qa.close()
```

## Integration with agent-browser

This tool wraps agent-browser CLI for browser automation:

```bash
# Connect to existing browser session
web-qa-bot smoke https://example.com --cdp 18800

# Run headed for debugging
web-qa-bot run ./tests/suite.yaml --no-headless
```

## Test Results Format

Results are returned as structured JSON:

```json
{
  "name": "Smoke Test",
  "url": "https://example.com",
  "summary": {
    "total": 4,
    "passed": 3,
    "failed": 0,
    "warnings": 1
  },
  "tests": [
    {
      "name": "Page Load",
      "status": "pass",
      "duration": 1234
    }
  ]
}
```

## Tips

1. **Use role-based selectors** - More reliable than CSS classes
2. **Check console errors** - Often reveals hidden issues
3. **Test both navigation methods** - Direct URL and in-app routing
4. **Screenshot on failure** - Automatic in test suites
5. **Monitor for modals** - Can block interactions

## Report Formats

- **Markdown** - Default, human-readable
- **PDF** - Professional reports via ai-pdf-builder
- **JSON** - Machine-readable for CI/CD

## Troubleshooting

### "agent-browser not found"
```bash
npm install -g agent-browser
agent-browser install
```

### "Element not found"
Take a snapshot first to see available refs:
```bash
agent-browser snapshot
```

### "Timeout waiting for element"
Increase timeout or check if element is behind a loading state:
```yaml
steps:
  - waitMs: 2000
  - waitFor: "Loading" # Wait for loading to appear
  - waitFor: "Content" # Then wait for content
```

## Links

- [GitHub](https://github.com/NextFrontierBuilds/web-qa-bot)
- [npm](https://www.npmjs.com/package/web-qa-bot)
