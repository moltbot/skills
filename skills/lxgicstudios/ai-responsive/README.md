# ai-responsive

Make any component responsive with proper breakpoints. Feed it a component file, get back a mobile-first responsive version.

## Install

```bash
npm install -g ai-responsive
```

## Usage

```bash
npx ai-responsive ./src/components/Hero.tsx
# Rewrites Hero.tsx with responsive breakpoints

npx ai-responsive ./src/components/Hero.tsx --dry-run
# Prints the responsive version without writing

npx ai-responsive ./src/components/Hero.tsx -o ./src/components/Hero.responsive.tsx
# Writes to a separate file
```

## Setup

```bash
export OPENAI_API_KEY=sk-...
```

## Options

- `-o, --output <path>` - Write to a different file instead of overwriting
- `--dry-run` - Print result without writing to disk

## How it works

Reads your component, sends it to GPT-4o-mini with mobile-first responsive design rules, and writes back the responsive version. Handles CSS, Tailwind, and styled-components.

## License

MIT
