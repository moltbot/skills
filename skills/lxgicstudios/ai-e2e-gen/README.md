# ai-e2e-gen

Generate Playwright (or Cypress) e2e tests from a URL, component file, or description.

## Install

```bash
npm install -g ai-e2e-gen
```

## Usage

```bash
npx ai-e2e-gen https://myapp.com
# Generates Playwright tests for the page

npx ai-e2e-gen ./src/LoginForm.tsx -o tests/login.spec.ts
# Generates tests from component, writes to file

npx ai-e2e-gen "shopping cart checkout flow"
# Generates tests from description
```

## Setup

```bash
export OPENAI_API_KEY=sk-...
```

## Options

- `-o, --output` - Write tests to a file
- `-f, --framework` - playwright or cypress (default: playwright)

## License

MIT
