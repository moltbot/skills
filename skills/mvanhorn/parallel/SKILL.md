---
name: parallel
description: High-accuracy web search and research via Parallel.ai API. Optimized for AI agents with rich excerpts and citations.
triggers:
  - parallel
  - deep search
  - research
metadata:
  clawdbot:
    emoji: "🔬"
---

# Parallel.ai 🔬

High-accuracy web search API built for AI agents. Outperforms Perplexity/Exa on research benchmarks.

## Setup

```bash
pip install parallel-web
```

API key is configured. Uses Python SDK.

```python
from parallel import Parallel
client = Parallel(api_key="YOUR_KEY")
response = client.beta.search(
    mode="one-shot",
    max_results=10,
    objective="your query"
)
```

## Quick Usage

```bash
# Search with Python SDK
python3 {baseDir}/scripts/search.py "Who is the CEO of Anthropic?" --max-results 5

# JSON output
python3 {baseDir}/scripts/search.py "latest AI news" --json
```

## Response Format

Returns structured results with:
- `search_id` - unique search identifier
- `results[]` - array of results with:
  - `url` - source URL
  - `title` - page title
  - `excerpts[]` - relevant text excerpts
  - `publish_date` - when available
- `usage` - API usage stats

## When to Use

- **Deep research** requiring cross-referenced facts
- **Company/person research** with citations
- **Fact-checking** with evidence-based outputs
- **Complex queries** that need multi-hop reasoning
- Higher accuracy than traditional search for research tasks

## API Reference

Docs: https://docs.parallel.ai
Platform: https://platform.parallel.ai
