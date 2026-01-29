# ai-a11y

Scan your HTML and JSX files for accessibility issues. Get WCAG-based suggestions with actual code fixes.

## Install

```bash
npm install -g ai-a11y
```

## Usage

```bash
npx ai-a11y ./src/components/Header.tsx
# Scans a single file

npx ai-a11y ./src/components/
# Scans all HTML/JSX files in a directory
```

## Setup

```bash
export OPENAI_API_KEY=sk-...
```

## License

MIT
