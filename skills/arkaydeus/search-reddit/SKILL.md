---
name: search-reddit
description: Search Reddit in real time using OpenAI web_search with enrichment (engagement + top comments). Use when you need recent Reddit threads, subreddit-filtered results, or quick link lists.
---

# Search Reddit

Real-time Reddit search powered by OpenAI web_search with post enrichment (score, comments, and top comment excerpts).

## Setup

Set your OpenAI API key:

```bash
clawdbot config set skills.entries.search-reddit.apiKey "sk-YOUR-KEY"
```

Or use environment variable:
```bash
export OPENAI_API_KEY="sk-YOUR-KEY"
```

You can also set a shared key:
```bash
clawdbot config set skills.entries.openai.apiKey "sk-YOUR-KEY"
```

## Commands

### Basic Search
```bash
node {baseDir}/scripts/search.js "Claude Code tips"
```

### Filter by Time
```bash
node {baseDir}/scripts/search.js --days 7 "AI news"
```

### Filter by Subreddit
```bash
node {baseDir}/scripts/search.js --subreddits machinelearning,openai "agents"
node {baseDir}/scripts/search.js --exclude bots "real discussions"
```

### Output Options
```bash
node {baseDir}/scripts/search.js --json "topic"        # JSON results
node {baseDir}/scripts/search.js --compact "topic"     # Minimal output
node {baseDir}/scripts/search.js --links-only "topic"  # Only Reddit links
```

## Example Usage in Chat

**User:** "Search Reddit for what people are saying about Claude Code"
**Action:** Run search with query "Claude Code"

**User:** "Find posts in r/OpenAI from the last week"
**Action:** Run search with --subreddits openai --days 7

**User:** "Get Reddit links about Kimi K2.5"
**Action:** Run search with --links-only "Kimi K2.5"

## How It Works

Uses OpenAI Responses API (`/v1/responses`) with the `web_search` tool:
- Allowed domain: `reddit.com`
- Enriches each thread by fetching Reddit JSON (`/r/.../comments/.../.json`)
- Updates the date from `created_utc` and filters to last N days
- Computes engagement and top comment excerpts

## Environment Variables

- `OPENAI_API_KEY` - OpenAI API key (required)
- `SEARCH_REDDIT_MODEL` - Model override (default: gpt-5.2)
- `SEARCH_REDDIT_DAYS` - Default days to search (default: 30)
