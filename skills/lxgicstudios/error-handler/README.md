# ai-error-handler

Generate complete error handling middleware for any framework. Custom error classes, async wrappers, proper status codes, the works.

## Install

```bash
npm install -g ai-error-handler
```

## Usage

```bash
npx ai-error-handler express
# Generates Express error handling middleware

npx ai-error-handler fastify -l javascript
# JavaScript version for Fastify

npx ai-error-handler nextjs -o lib/errors.ts
# Save to file
```

## Setup

```bash
export OPENAI_API_KEY=sk-...
```

## Options

- `-l, --lang <language>` - typescript or javascript (default: typescript)
- `-o, --output <path>` - Save to file

## License

MIT
