---
name: perplexity
description: Use Perplexity API for web-grounded AI search and research. Use when user needs up-to-date information, multi-step reasoning with web citations, exhaustive research with source references, factual queries with current events, or competitive analysis. Default when user mentions Perplexity, needs current information, or requires source citations.
---

# Perplexity AI Search

## Overview

This skill provides access to the Perplexity API for web-grounded AI search and research. It combines the power of large language models with real-time web search, providing accurate, up-to-date answers with source citations.

## When to Use Perplexity vs. Built-in Search

**Use Perplexity when:**
- You need **current information** (news, prices, events, recent developments)
- The user asks for **source citations** or references
- Complex **multi-step reasoning** is required
- The user specifically mentions Perplexity or wants research-style answers
- You need **exhaustive analysis** across multiple sources

**Use built-in web search when:**
- Simple factual queries
- Quick information lookup
- The user doesn't need AI-generated synthesis
- Basic URL or content retrieval is sufficient

## Model Selection Guide

Choose the right model based on task complexity:

### 🔍 Search Models (Quick Facts)
Use for simple, factual queries where speed matters.

- `sonar` - Default search model with web access. Best for most queries.
- `sonar-pro` - Advanced search with deeper understanding.

### 🧠 Reasoning Models (Complex Analysis)
Use for complex, multi-step tasks requiring logical thinking.

- `sonar-reasoning` - Complex reasoning with web search.
- `sonar-reasoning-pro` - Advanced reasoning with deeper content understanding.

### 📚 Research Models (Exhaustive Analysis)
Use for comprehensive, in-depth research across multiple sources.

- `sonar-research` - Comprehensive research with in-depth analysis.
- `sonar-research-pro` - Advanced research with exhaustive analysis and detailed reports.

## Quick Start

### Basic Search

```bash
# Simple query (uses sonar by default)
scripts/perplexity_search.sh "What is the capital of Germany?"

# With custom model
scripts/perplexity_search.sh "Latest AI developments" -m sonar-pro

# Markdown format with citations
scripts/perplexity_search.sh "Tesla stock analysis" -f markdown
```

### Advanced Research

```bash
# Deep research with comprehensive analysis
scripts/perplexity_search.sh "Market analysis for electric vehicles in 2025" \
  -m sonar-research-pro -c high -f markdown

# Pro search mode (multi-step reasoning)
scripts/perplexity_search.sh "Compare AI models performance benchmarks" \
  -m sonar-reasoning-pro -p pro -f markdown

# With custom system prompt
scripts/perplexity_search.sh "Analyze tech trends" \
  -s "You are a technology analyst. Focus on business implications and market trends."
```

## Search Context Size

Control how much web information is retrieved:

- **low** - Faster, fewer sources. Good for simple queries.
- **medium** (default) - Balanced. Good for most use cases.
- **high** - Most comprehensive. Best for research and detailed analysis.

## Pro Search Mode

Available for `sonar-pro` and reasoning models. Controls multi-step tool usage:

- **fast** (default) - Standard single-step search.
- **pro** - Automated multi-step reasoning with multiple web searches.
- **auto** - Automatic classification based on query complexity.

## Setup Requirements

### API Key Configuration

The skill requires Perplexity API key. There are two ways to configure it:

**Option 1: Skill-specific config file (recommended)**
Create `config.json` in the skill directory:
```json
{
  "apiKey": "pplx-your-key-here"
}
```

**Option 2: Environment variable**
```bash
export PERPLEXITY_API_KEY="your-key-here"
```

To set it permanently (add to ~/.bashrc or ~/.zshrc):
```bash
echo 'export PERPLEXITY_API_KEY="your-key-here"' >> ~/.bashrc
source ~/.bashrc
```

**Priority:** Config file takes precedence over environment variable.

### Dependencies

The script uses bash and curl. Both are typically pre-installed on Linux systems.

## Usage Patterns

### News and Current Events
```bash
scripts/perplexity_search.sh "Latest news about AI regulation in Europe" -m sonar
```

### Competitive Analysis
```bash
scripts/perplexity_search.sh "Compare iPhone 15 vs Samsung Galaxy S24 features" \
  -m sonar-reasoning-pro -c high -f markdown
```

### Market Research
```bash
scripts/perplexity_search.sh "Electric vehicle market forecast 2025-2030" \
  -m sonar-research-pro -c high -p pro -f markdown
```

### Technical Questions with Current Data
```bash
scripts/perplexity_search.sh "Latest Python frameworks for web development 2025" \
  -m sonar-reasoning -c medium
```

## Output Formats

- **text** (default) - Plain text with citation references [1], [2], etc.
- **markdown** - Markdown formatted response with source links
- **json** - Raw API response in JSON format

## Cost Awareness

Perplexity API is not free. Be mindful of usage costs:

- **Simple queries**: ~$0.005–$0.015 per query
- **Deep research**: ~$0.015–$0.03+ per query
- **Pro users get $5/month credits** in Perplexity Pro subscription

Use reasoning/research models judiciously. Default to `sonar` for most queries.

## List Available Models

```bash
scripts/perplexity_search.sh --list-models
```

## Troubleshooting

**Error: PERPLEXITY_API_KEY environment variable not set**
- Set up API key as described in "Setup Requirements" above

**Error: curl command not found**
- Install curl: `apt install curl` or equivalent for your system

**Error: Unexpected API response**
- Check your API key is valid and has not been revoked
- Verify your Perplexity account has API access

## Resources

### scripts/

- **perplexity_search.sh** - Main script for Perplexity API interactions
  - Supports all Perplexity models
  - Handles API key discovery from environment or config
  - Provides multiple output formats
  - Uses curl for API calls (no Python dependencies)

---

**Note:** This skill uses external API calls. Be mindful of rate limits and costs. The API key should never be committed to version control or shared publicly.
