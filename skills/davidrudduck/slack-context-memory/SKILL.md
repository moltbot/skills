---
name: slack-context-memory
description: Conversation summarization and context compaction for Slack channels. Reduces context window usage by 70-99% while preserving key information through semantic summaries.
---

# Slack Context Memory

Compress Slack conversation history into searchable summaries for context-efficient sessions.

## Problem Solved

Clawdbot sessions lose context as conversation history grows. This skill:

1. **Detects conversation boundaries** in Slack message history
2. **Generates structured summaries** (TL;DR, decisions, topics, outcome)
3. **Stores summaries with embeddings** for semantic search
4. **Compacts context** - replace 1000s of messages with a few summaries
5. **Enables semantic retrieval** - find relevant past discussions

## Quick Start

```bash
# Setup database schema
cd /home/david/clawd/scripts/slack-context-memory
node setup-schema.js

# View compacted context for a channel
node context-compactor.js C0ABGHA7CBE

# Compare original vs compacted size
node context-compactor.js C0ABGHA7CBE --compare

# Search for relevant conversations
node context-compactor.js --query "email newsletter filtering"
```

## Token Savings

| Channel | Original | Compacted | Savings |
|---------|----------|-----------|---------|
| #accounts (1000 msgs) | 112K tokens | 951 tokens | **99.2%** |
| #homeassistant (50 msgs) | 3.1K tokens | 911 tokens | **70.8%** |

## Components

### Conversation Detection
```bash
node detect-conversations.js <channel_id>
node detect-conversations.js --all
```

### Context Compaction
```bash
node context-compactor.js <channel_id> --recent 20
node context-compactor.js <channel_id> --compare
node context-compactor.js --query "search term"
```

### Search
```bash
node search-conversations.js semantic "query"
node search-conversations.js text "query"
node search-conversations.js recent --limit 10
```

## Requirements

- PostgreSQL database with pgvector
- Node.js 18+
- Slack message history in database

## Database Schema

The `conversation_summaries` table stores:
- `tldr` - 1-2 sentence summary
- `full_summary` - Detailed summary
- `key_decisions` - Array of decisions made
- `topics` - Array of topics discussed
- `outcome` - resolved/ongoing/needs-follow-up
- `embedding` - Vector for semantic search (1024-dim)

---

Built for Clawdbot 🦞 | 2026-01-28
