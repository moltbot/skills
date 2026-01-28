# Search Reddit — Real-time Reddit Search for Clawdbot

Search Reddit in real-time using OpenAI's `web_search` tool. Results are enriched with engagement stats and top comment excerpts.

## Installation

```bash
clawdhub install search-reddit
```

Or manually:
```bash
cd ~/clawd/skills && git clone https://github.com/mvanhorn/clawdbot-skill-search-reddit search-reddit
```

## Setup

Get your API key from https://platform.openai.com, then:

```bash
clawdbot config set skills.entries.search-reddit.apiKey "sk-YOUR-KEY"
```

Or set environment variable:
```bash
export OPENAI_API_KEY="sk-YOUR-KEY"
```

You can also set a shared key:
```bash
clawdbot config set skills.entries.openai.apiKey "sk-YOUR-KEY"
```

## Usage

### Basic Search
```bash
node scripts/search.js "Claude Code tips"
```

### Time Filter
```bash
node scripts/search.js --days 7 "breaking news"    # Last 7 days
node scripts/search.js --days 1 "trending today"   # Last 24 hours
```

### Subreddit Filters
```bash
node scripts/search.js --subreddits machinelearning,openai "agents"
node scripts/search.js --exclude bots "real discussions"
```

### Output Formats
```bash
node scripts/search.js --compact "topic"      # Minimal output
node scripts/search.js --links-only "topic"   # Just URLs
node scripts/search.js --json "topic"         # JSON results
```

## Chat Examples

Just tell your Clawdbot:
- "Search Reddit for what people are saying about Claude"
- "Find posts in r/OpenAI from the last week"
- "Get Reddit links about Kimi K2.5"

## How It Works

Uses OpenAI's Responses API with the `web_search` tool:
- **Endpoint:** `/v1/responses`
- **Model:** `gpt-5.2` (default)
- **Features:** Date filtering, subreddit filtering, enrichment via Reddit JSON

## Output Example

```
🔍 Searching Reddit: "Kimi K2.5" (last 7 days)...

**Kimi K2.5 impressions?**
r/MachineLearning • 2026-01-22
https://www.reddit.com/r/MachineLearning/comments/xxxxxx/...
Score: 231 • Comments: 82 • Upvote ratio: 0.92
Top comments:
- user1 (120): Interesting that...
- user2 (88): I tested it and...

📎 Links (3):
   https://www.reddit.com/r/MachineLearning/comments/xxxxxx/...
```

## License

MIT
