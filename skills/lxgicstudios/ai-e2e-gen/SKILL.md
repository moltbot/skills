---
name: e2e-gen
description: Generate Playwright/Cypress E2E tests from user flows
---

# E2E Test Generator

Describe user flows, get Playwright or Cypress tests. No more writing login tests by hand.

## Quick Start

```bash
npx ai-e2e-gen "User signs up, verifies email, completes onboarding"
```

## What It Does

- Converts flow descriptions to E2E tests
- Generates Playwright or Cypress code
- Includes proper waits and assertions
- Adds data-testid selectors

## Usage Examples

```bash
# Generate Playwright test
npx ai-e2e-gen "User adds item to cart and checks out"

# Generate Cypress test
npx ai-e2e-gen "Admin creates new user" --framework cypress

# From existing page
npx ai-e2e-gen --url http://localhost:3000/dashboard
```

## Output Example

```typescript
test('user completes checkout', async ({ page }) => {
  await page.goto('/products');
  await page.click('[data-testid="add-to-cart"]');
  await page.click('[data-testid="checkout"]');
  await expect(page.locator('.success')).toBeVisible();
});
```

## Requirements

Node.js 18+. OPENAI_API_KEY required.

## License

MIT. Free forever.
