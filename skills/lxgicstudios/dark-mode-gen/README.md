# ai-dark-mode

Add dark mode support to any component or entire directory. Handles CSS variables, Tailwind dark: prefixes, and prefers-color-scheme.

## Install

```bash
npm install -g ai-dark-mode
```

## Usage

```bash
npx ai-dark-mode ./src/components/Card.tsx
# Adds dark mode to a single file

npx ai-dark-mode ./src/components/
# Adds dark mode to all components in a directory

npx ai-dark-mode ./src/components/Card.tsx --dry-run
# Preview without writing
```

## Setup

```bash
export OPENAI_API_KEY=sk-...
```

## Options

- `--dry-run` - Print result without writing to disk

## License

MIT
