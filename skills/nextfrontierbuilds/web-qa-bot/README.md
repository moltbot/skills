# web-qa-bot

AI-powered web application QA automation using accessibility-tree based testing.

[![npm version](https://badge.fury.io/js/web-qa-bot.svg)](https://www.npmjs.com/package/web-qa-bot)

## Features

- **Accessibility-first testing** - Uses browser accessibility tree instead of CSS selectors
- **Smart element detection** - Role-based locators with auto-wait and retry logic
- **Console monitoring** - Captures errors, warnings, and custom events
- **Modal detection** - Automatically detects dialogs and popups
- **Stale ref handling** - Re-snapshots when elements become stale
- **Professional reports** - Markdown and PDF output via ai-pdf-builder
- **Smoke tests** - Quick health checks for any URL
- **Built on agent-browser** - Fast, reliable browser automation

## Installation

```bash
npm install -g web-qa-bot

# Peer dependency
npm install -g agent-browser
agent-browser install
```

## Quick Start

### Smoke Test

Run quick health checks on any URL:

```bash
web-qa-bot smoke https://example.com
```

Output:
```
=== Smoke Test Results ===

URL: https://example.com
Duration: 2.34s

✓ Page Load: PASS
✓ Console Errors: PASS
✓ Navigation: PASS
✓ Images: PASS

Total: 4 | Pass: 4 | Fail: 0 | Warn: 0
```

### Test Suite

Create a test suite file (`tests/homepage.yaml`):

```yaml
name: Homepage Tests
baseUrl: https://example.com

tests:
  - name: Page loads with title
    steps:
      - goto: /
      - expectVisible: heading
      - expectTitle: "Example Domain"

  - name: Navigation works
    steps:
      - goto: /
      - click: "More information"
      - expectUrl:
          contains: /about

  - name: No console errors
    steps:
      - goto: /
      - expectNoErrors: true
```

Run the suite:

```bash
web-qa-bot run ./tests/homepage.yaml --output report.md
```

### Generate PDF Report

```bash
web-qa-bot report ./results.json -o report.pdf -f pdf --company "Acme Corp"
```

## CLI Commands

### `smoke <url>`

Run smoke tests on a URL.

```bash
web-qa-bot smoke https://example.com [options]

Options:
  --checks <list>    Comma-separated checks: pageLoad,consoleErrors,navigation,images,forms,accessibility,performance
  --timeout <ms>     Timeout in milliseconds (default: 30000)
  -o, --output       Output report path
```

### `run <suite>`

Run a test suite from a YAML or JSON file.

```bash
web-qa-bot run ./tests/suite.yaml [options]

Options:
  --cdp <port>       Connect to existing browser on CDP port
  --no-headless      Run in headed mode (visible browser)
  --timeout <ms>     Default timeout
  -o, --output       Output report path
  -f, --format       Report format: markdown, pdf, json
  --company          Company name for PDF header
  --verbose          Enable verbose logging
```

### `report <results>`

Generate a report from test results.

```bash
web-qa-bot report ./results.json -o report.pdf

Options:
  -o, --output       Output file path
  -f, --format       Report format: markdown, pdf, json
  --company          Company name for PDF header
```

## Programmatic API

```typescript
import { QABot, smokeTest } from 'web-qa-bot'

// Quick smoke test
const result = await smokeTest({
  url: 'https://example.com',
  checks: ['pageLoad', 'consoleErrors', 'navigation']
})

console.log(result.summary) // { total: 3, passed: 3, failed: 0, ... }

// Full test suite
const qa = new QABot({
  baseUrl: 'https://example.com',
  headless: true,
  screenshotDir: './screenshots'
})

try {
  // Navigate
  await qa.goto('/')
  
  // Interact
  await qa.click('Login')
  await qa.type('Email', 'user@example.com')
  await qa.type('Password', 'secret')
  await qa.click('Submit')
  
  // Assert
  await qa.snapshot()
  qa.expectVisible('Dashboard')
  qa.expectUrl({ contains: '/dashboard' })
  await qa.expectNoErrors()
  
  // Generate report
  await qa.generateReport('./report.pdf', { format: 'pdf' })
} finally {
  await qa.close()
}
```

## Test Suite Format

Test suites can be written in YAML or JSON:

```yaml
name: My Test Suite
baseUrl: https://example.com

# Run before all tests
beforeAll:
  - goto: /login
  - type: { ref: Email, text: admin@example.com }
  - type: { ref: Password, text: secret }
  - click: Submit
  - waitFor: Dashboard

# Run before each test
beforeEach:
  - goto: /

# Test cases
tests:
  - name: Homepage loads
    steps:
      - goto: /
      - expectVisible: Welcome
    
  - name: Search works
    steps:
      - type: { ref: Search, text: hello }
      - press: Enter
      - waitFor: Results
      - expectCount: { selector: article, min: 1 }
    
  - name: Known issue (still runs, marked as warning)
    knownIssue: JIRA-123
    steps:
      - click: Broken Button
      - expectVisible: Success

  - name: Skip this test
    skip: true
    steps:
      - goto: /disabled-feature

# Run after each test
afterEach:
  - screenshot: after-test

# Run after all tests
afterAll:
  - click: Logout
```

## Available Assertions

| Assertion | Description |
|-----------|-------------|
| `expectVisible(selector)` | Element exists in accessibility tree |
| `expectNotVisible(selector)` | Element does not exist |
| `expectText(selector, text)` | Element has matching text |
| `expectUrl({ contains })` | URL matches pattern |
| `expectCount(role, count)` | Count of elements with role |
| `expectNoErrors()` | No console errors |
| `expectConsoleEvent(pattern)` | Console event matches pattern |
| `expectModal(present)` | Modal is present/absent |
| `expectTitle(text)` | Page title matches |
| `expectClickable(selector)` | Element is interactive and enabled |

## Available Actions

| Action | Description |
|--------|-------------|
| `goto(url)` | Navigate to URL |
| `click(selector)` | Click element |
| `type(selector, text)` | Type text into element |
| `press(key)` | Press keyboard key |
| `hover(selector)` | Hover over element |
| `select(selector, value)` | Select dropdown option |
| `waitFor(selector)` | Wait for element to appear |
| `waitForLoad()` | Wait for page load |
| `waitForUrl(pattern)` | Wait for URL to match |
| `screenshot(name)` | Take screenshot |
| `snapshot()` | Take accessibility tree snapshot |

## Element Selectors

web-qa-bot uses accessibility-tree based selectors:

```typescript
// By ref ID (from snapshot output)
await qa.click('@e42')

// By text content
await qa.click('Submit')

// By role:name
await qa.click('button:Submit')

// By role with partial name
await qa.waitFor('heading')  // Any heading
```

## Best Practices

Based on Playwright testing best practices:

1. **Test user-visible behavior** - Not implementation details
2. **Use role-based locators** - Accessibility refs over CSS classes
3. **Web-first assertions** - Built-in auto-wait, no manual timeouts
4. **Isolated tests** - Each test starts fresh
5. **No third-party dependencies** - Mock external services

## Learnings Integrated

This tool incorporates learnings from real-world QA sessions:

- **Async data handling** - Configurable wait strategies for dynamic content
- **Stale ref detection** - Automatic re-snapshot when elements change
- **Modal detection** - Via DOM and console event monitoring
- **Route comparison** - Test direct URL vs in-app navigation
- **Audio/media state** - UI state verification for media elements

## Requirements

- Node.js 18+
- agent-browser CLI (peer dependency)
- For PDF reports: ai-pdf-builder and LaTeX

## License

MIT

## Contributing

PRs welcome! Please read the contributing guidelines first.

---

Built by [NextFrontierBuilds](https://github.com/NextFrontierBuilds)
