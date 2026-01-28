# ai-webhook

Generate production-ready webhook handlers with signature verification, retry logic, and idempotency. Just describe the event.

## Install

```bash
npm install -g ai-webhook
```

## Usage

```bash
npx ai-webhook "stripe payment succeeded"
# Generates Express webhook handler with retry logic

npx ai-webhook "github push event" -f nextjs
# Next.js API route handler

npx ai-webhook "shopify order created" -o webhook-handler.ts
# Save to file
```

## Setup

```bash
export OPENAI_API_KEY=sk-...
```

## Options

- `-f, --framework <name>` - Framework: express, fastify, nextjs (default: express)
- `-o, --output <path>` - Save to file

## License

MIT
