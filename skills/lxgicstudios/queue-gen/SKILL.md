---
name: queue-gen
description: Generate BullMQ job queue setup and workers. Use when implementing background jobs.
---

# Queue Generator

Background jobs need queues, workers, and retry logic. Describe your job and get a complete BullMQ setup.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-queue "send welcome email after signup"
```

## What It Does

- Generates BullMQ queue configuration
- Creates worker code with proper error handling
- Includes retry logic and backoff strategies
- Sets up job scheduling

## Usage Examples

```bash
# Email queue
npx ai-queue "send welcome email after signup"

# Payment processing
npx ai-queue "process payment and update order status"

# Scheduled job
npx ai-queue "generate daily report at midnight"
```

## Best Practices

- **Idempotent jobs** - same input, same result
- **Set reasonable timeouts** - don't hang forever
- **Log job progress** - know what failed
- **Handle failures gracefully** - retry with backoff

## When to Use This

- Adding background processing to your app
- Moving slow operations out of requests
- Setting up scheduled tasks
- Learning job queue patterns

## Part of the LXGIC Dev Toolkit

This is one of 110+ free developer tools built by LXGIC Studios. No paywalls, no sign-ups, no API keys on free tiers. Just tools that work.

**Find more:**
- GitHub: https://github.com/LXGIC-Studios
- Twitter: https://x.com/lxgicstudios
- Substack: https://lxgicstudios.substack.com
- Website: https://lxgicstudios.com

## Requirements

No install needed. Just run with npx. Node.js 18+ recommended. Needs OPENAI_API_KEY environment variable.

```bash
npx ai-queue --help
```

## How It Works

Takes your job description and generates BullMQ queue configuration, worker code, and job producer code. Includes proper TypeScript types and error handling patterns.

## License

MIT. Free forever. Use it however you want.
