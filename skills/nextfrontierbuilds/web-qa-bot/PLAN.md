# Web QA Bot - Project Plan

## Overview

Two related projects:
1. **web-qa-bot** - Generic web app QA automation (npm + skill)
2. **strykr-qa-bot** - Strykr-specific QA extension (skill only)

---

## 1. web-qa-bot (Generic)

### Distribution
- **npm:** `web-qa-bot`
- **GitHub:** `NextFrontierBuilds/web-qa-bot`
- **ClawdHub:** `NextFrontierBuilds/web-qa-bot`

### Core Features

#### Browser Automation
- Built on agent-browser CLI (fast, accessibility-tree based)
- Fallback to Playwright for complex scenarios
- CDP connection for existing browser sessions
- Headless and headed modes

#### Smart Element Detection
- Role-based locators (accessibility tree refs)
- Auto-wait for elements with retry logic
- Stale ref detection and re-snapshot
- Console log monitoring for hidden interactions

#### Test Primitives
```typescript
// Navigation
await qa.goto(url)
await qa.waitForLoad()
await qa.waitForSelector(selector, { timeout: 5000 })

// Interactions
await qa.click(ref)
await qa.type(ref, text)
await qa.select(ref, value)
await qa.hover(ref)

// Assertions
await qa.expectVisible(ref)
await qa.expectText(ref, text)
await qa.expectCount(selector, count)
await qa.expectConsoleEvent(pattern)
await qa.expectNoErrors()

// Snapshots
await qa.snapshot()
await qa.screenshot(name)
await qa.getConsole()
```

#### Test Suites
```typescript
const suite = qa.suite('Homepage', {
  url: 'https://example.com',
  tests: [
    {
      name: 'Navigation links work',
      steps: [
        { action: 'click', ref: 'nav-about' },
        { expect: 'url', contains: '/about' }
      ]
    }
  ]
})
```

#### Reporting
- Markdown report generation
- PDF export via ai-pdf-builder
- Screenshots embedded in reports
- Pass/Fail/Warn status
- Console errors captured
- Timing metrics

### Learnings Integrated

1. **Async Data Handling**
   - Auto-detect loading states
   - Configurable wait strategies
   - Retry on stale refs

2. **Modal Detection**
   - Monitor DOM for dialog elements
   - Console event detection (analytics, warnings)
   - Screenshot before/after interactions

3. **Route Testing**
   - Direct URL navigation tests
   - In-app navigation tests
   - Compare behavior differences

4. **Audio/Media Verification**
   - UI state change detection (play → pause)
   - Media element state checking

5. **Error Capture**
   - Console errors/warnings
   - Network failures
   - Unhandled exceptions

### Best Practices Built-in

1. **User-visible testing** - Test what users see, not implementation
2. **Role-based locators** - Accessibility refs, not CSS classes
3. **Auto-wait assertions** - No manual timeouts
4. **Isolated tests** - Each test starts fresh
5. **No third-party deps** - Mock external services

### CLI Usage
```bash
# Run test suite
npx web-qa-bot run ./tests/suite.yaml --url https://example.com

# Quick smoke test
npx web-qa-bot smoke https://example.com

# Generate report
npx web-qa-bot report ./results --output report.pdf

# Interactive mode (for building tests)
npx web-qa-bot interactive https://example.com
```

### Programmatic API
```typescript
import { QABot } from 'web-qa-bot'

const qa = new QABot({
  baseUrl: 'https://example.com',
  browser: 'chromium',
  headless: true,
  screenshotDir: './screenshots'
})

await qa.run([
  { goto: '/' },
  { click: 'button[name="Login"]' },
  { expectVisible: 'form[name="login"]' }
])

await qa.generateReport('./report.pdf')
```

---

## 2. strykr-qa-bot (Strykr-Specific)

### Distribution
- **GitHub:** `NextFrontierBuilds/strykr-qa-bot`
- **ClawdHub:** `NextFrontierBuilds/strykr-qa-bot`

### Features
- Extends web-qa-bot
- Pre-built test suites for all Strykr pages
- PRISM API endpoint validation
- Strykr component patterns

### Pre-built Test Suites

#### Homepage Suite
- Market status indicator
- AI chat widget
- News carousel
- Signals preview
- Events widget
- Navigation links

#### Crypto Signals Suite
- Page load with data
- Long/Short filters
- Chain filters (EVM/Solana)
- Signal sorting
- Listen button state
- Ask Strykr AI button
- Details modal (with issue detection)
- Sparkline charts

#### Stock Signals Suite
- Asset type filters
- Signal data display
- Action buttons

#### News Suite
- Direct URL vs nav routing
- Category filters
- Sentiment filters
- Listen/Share/Ask buttons

#### Events Suite
- Direct URL routing
- Event cards
- Impact indicators

#### AI Chat Suite
- Direct input
- Pre-filled queries
- Response quality checks
- Loading states

### Strykr-Specific Assertions
```typescript
// Check signal card renders correctly
await strykr.expectSignalCard({
  symbol: 'JUP',
  hasPrice: true,
  hasChart: true,
  hasActions: true
})

// Check AI response quality
await strykr.expectAIResponse({
  hasPrice: true,
  hasTechnicals: true,
  minLength: 200
})

// Check PRISM API health
await strykr.checkPrismEndpoints()
```

### Configuration
```yaml
# strykr-qa.yaml
baseUrl: https://app.strykr.ai
suites:
  - homepage
  - crypto-signals
  - stock-signals
  - news
  - events
  - ai-chat

knownIssues:
  - id: details-modal-empty
    description: Details modal opens but content fails to load
    severity: high
    skipTest: false  # Still test, but mark as known issue

  - id: direct-url-blank
    description: /news and /economic-events blank on direct nav
    severity: medium
    affectedRoutes:
      - /news
      - /economic-events
```

---

## File Structure

### web-qa-bot
```
web-qa-bot/
├── src/
│   ├── index.ts          # Main exports
│   ├── bot.ts            # QABot class
│   ├── browser.ts        # Browser automation
│   ├── assertions.ts     # Test assertions
│   ├── reporter.ts       # Report generation
│   ├── cli.ts            # CLI entry point
│   └── utils/
│       ├── wait.ts       # Wait strategies
│       ├── console.ts    # Console monitoring
│       └── snapshot.ts   # Screenshot helpers
├── templates/
│   └── report.md         # Report template
├── bin/
│   └── web-qa-bot        # CLI binary
├── package.json
├── tsconfig.json
├── README.md
└── SKILL.md              # ClawdHub skill
```

### strykr-qa-bot
```
strykr-qa-bot/
├── suites/
│   ├── homepage.yaml
│   ├── crypto-signals.yaml
│   ├── stock-signals.yaml
│   ├── news.yaml
│   ├── events.yaml
│   └── ai-chat.yaml
├── src/
│   ├── strykr-bot.ts     # Strykr extensions
│   └── assertions.ts     # Strykr-specific assertions
├── config/
│   └── known-issues.yaml
├── README.md
└── SKILL.md              # ClawdHub skill
```

---

## Implementation Order

1. **Phase 1: Core web-qa-bot**
   - Browser automation wrapper
   - Basic assertions
   - Markdown reporting
   - CLI scaffolding

2. **Phase 2: Advanced Features**
   - Console monitoring
   - Modal detection
   - Route comparison
   - PDF reporting

3. **Phase 3: strykr-qa-bot**
   - Strykr test suites
   - Known issue tracking
   - PRISM API checks

4. **Phase 4: Polish**
   - ClawdHub skills
   - Documentation
   - npm publish

---

## Success Criteria

- [ ] `npx web-qa-bot smoke https://example.com` runs basic checks
- [ ] Generates professional PDF report via ai-pdf-builder
- [ ] Detects common issues (console errors, broken links, missing elements)
- [ ] strykr-qa-bot catches the issues we found today
- [ ] Both published to npm/ClawdHub
