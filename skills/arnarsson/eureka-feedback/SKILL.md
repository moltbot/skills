---
name: eureka-feedback
description: Request feedback or assistance from Eureka, the primary AI agent
triggers:
  - ask eureka
  - eureka feedback
  - check with eureka
  - delegate to eureka
---

# Communicate with Eureka

Eureka is the primary AI agent running as @Eureka_Agent_Bot on Telegram. Eureka uses Opus 4.5 and handles higher-level planning, decision-making, and orchestration.

## When to reach out to Eureka
- Need strategic guidance or architectural decisions
- Want feedback on an approach before implementing
- Task requires capabilities outside pure coding (home automation, scheduling, memory)
- Reporting back completion of a delegated task

## How to message Eureka

Send a message to Eureka's agent:

```bash
clawdbot agent --agent main --message "<your message>"
```

To send AND have Eureka's response delivered back via your Telegram bot:

```bash
clawdbot agent --agent main --message "<message>" --deliver --reply-channel telegram --reply-account mason --reply-to 1878354815
```

## Best practices
- Be concise about what you need — Eureka is Opus-powered so token-efficient requests are appreciated
- When reporting task completion, summarize what was done and any issues encountered
- If Eureka delegated a task to you, report back with the result
