# Web Search Plus

> Unified multi-provider web search supporting **Serper**, **Tavily**, and **Exa** — choose the right tool for every search task.

[![ClawdHub](https://img.shields.io/badge/ClawdHub-web--search--plus-blue)](https://clawdhub.com)
[![Version](https://img.shields.io/badge/version-1.0.4-green)](https://clawdhub.com)
[![GitHub](https://img.shields.io/badge/GitHub-web--search--plus-blue)](https://github.com/robbyczgw-cla/web-search-plus)

---

## 🔍 When to Use Which Provider

### Built-in Brave Search (Clawdbot default)
- ✅ General web searches
- ✅ Privacy-focused
- ✅ Quick lookups
- ✅ Default fallback

### Serper (Google Results)
- 🛍️ **Product specs, prices, shopping**
- 📍 **Local businesses, places**
- 🎯 **"Google it" - explicit Google results**
- 📰 **Shopping/images needed**
- 🏆 **Knowledge Graph data**

### Tavily (AI-Optimized Research)
- 📚 **Research questions, deep dives**
- 🔬 **Complex multi-part queries**
- 📄 **Need full page content** (not just snippets)
- 🎓 **Academic/technical research**
- 🔒 **Domain filtering** (trusted sources)

### Exa (Neural Semantic Search)
- 🔗 **Find similar pages**
- 🏢 **Company/startup discovery**
- 📝 **Research papers**
- 💻 **GitHub projects**
- 📅 **Date-specific content**

---

## Table of Contents

- [Quick Start](#quick-start)
- [Provider Deep Dives](#provider-deep-dives)
  - [Serper (Google Search API)](#serper-google-search-api)
  - [Tavily (Research Search)](#tavily-research-search)
  - [Exa (Neural Search)](#exa-neural-search)
- [Configuration Guide](#configuration-guide)
- [Usage Examples](#usage-examples)
- [Workflow Examples](#workflow-examples)
- [Optimization Tips](#optimization-tips)
- [FAQ & Troubleshooting](#faq--troubleshooting)
- [API Reference](#api-reference)

---

## Quick Start

```bash
# 1. Set up at least one API key
export SERPER_API_KEY="your-key"   # https://serper.dev
export TAVILY_API_KEY="your-key"   # https://tavily.com
export EXA_API_KEY="your-key"      # https://exa.ai

# 2. Run a search
python3 scripts/search.py -p serper -q "iPhone 16 specs"
python3 scripts/search.py -p tavily -q "quantum computing explained" --depth advanced
python3 scripts/search.py -p exa -q "AI startups 2024" --category company
```

---

## Provider Deep Dives

### Serper (Google Search API)

**What it is:** Direct access to Google Search results via API — the same results you'd see on google.com.

#### Strengths
| Strength | Description |
|----------|-------------|
| 🎯 **Accuracy** | Google's search quality, knowledge graph, featured snippets |
| 🛒 **Shopping** | Product prices, reviews, shopping results |
| 📍 **Local** | Business listings, maps, places |
| 📰 **News** | Real-time news with Google News integration |
| 🖼️ **Images** | Google Images search |
| ⚡ **Speed** | Fastest response times (~200-400ms) |

#### Best Use Cases
- ✅ Product specifications and comparisons
- ✅ Shopping and price lookups
- ✅ Local business searches ("restaurants near me")
- ✅ Quick factual queries (weather, conversions, definitions)
- ✅ News headlines and current events
- ✅ Image searches
- ✅ When you need "what Google shows"

#### When NOT to Use
- ❌ Deep research requiring full article content
- ❌ Semantic/conceptual queries
- ❌ Finding similar companies or pages

#### Pricing (as of 2024)
| Tier | Queries | Price |
|------|---------|-------|
| Free | 2,500 | $0 |
| Starter | 50,000/mo | $50/mo |
| Standard | 100,000/mo | $75/mo |

**Cost per query:** ~$0.001 (paid tier)

#### Getting Your API Key
1. Go to [serper.dev](https://serper.dev)
2. Sign up with email or Google
3. Copy your API key from the dashboard
4. Set `SERPER_API_KEY` environment variable

---

### Tavily (Research Search)

**What it is:** AI-optimized search engine built for research and RAG applications — returns synthesized answers plus full content.

#### Strengths
| Strength | Description |
|----------|-------------|
| 📚 **Research Quality** | Optimized for comprehensive, accurate research |
| 💬 **AI Answers** | Returns synthesized answers, not just links |
| 📄 **Full Content** | Can return complete page content (raw_content) |
| 🎯 **Domain Filtering** | Include/exclude specific domains |
| 🔬 **Deep Mode** | Advanced search for thorough research |
| 📰 **Topic Modes** | Specialized for general vs news content |

#### Best Use Cases
- ✅ Research questions requiring synthesized answers
- ✅ Academic or technical deep dives
- ✅ When you need actual page content (not just snippets)
- ✅ Multi-source information comparison
- ✅ Domain-specific research (filter to authoritative sources)
- ✅ News research with context
- ✅ RAG/LLM applications

#### When NOT to Use
- ❌ Quick factual lookups (overkill)
- ❌ Shopping/product searches
- ❌ Local business searches
- ❌ Image searches

#### Pricing (as of 2024)
| Tier | Queries | Price |
|------|---------|-------|
| Free | 1,000/mo | $0 |
| Basic | 1,000/mo | $5/mo |
| Pro | 10,000/mo | $40/mo |
| Enterprise | Custom | Contact |

**Cost per query:** $0.004-0.005 (paid tier)

#### Getting Your API Key
1. Go to [tavily.com](https://tavily.com)
2. Sign up and verify email
3. Navigate to API Keys section
4. Generate and copy your key
5. Set `TAVILY_API_KEY` environment variable

---

### Exa (Neural Search)

**What it is:** Neural/semantic search engine that understands meaning, not just keywords — finds conceptually similar content.

#### Strengths
| Strength | Description |
|----------|-------------|
| 🧠 **Semantic Understanding** | Finds results by meaning, not keywords |
| 🔗 **Similar Pages** | Find pages similar to a reference URL |
| 🏢 **Company Discovery** | Excellent for finding startups, companies |
| 📑 **Category Filters** | Filter by type (company, paper, tweet, etc.) |
| 📅 **Date Filtering** | Precise date range searches |
| 🎓 **Academic** | Great for research papers and technical content |

#### Best Use Cases
- ✅ Conceptual queries ("companies building X")
- ✅ Finding similar companies or pages
- ✅ Startup and company discovery
- ✅ Research paper discovery
- ✅ Finding GitHub projects
- ✅ Date-filtered searches for recent content
- ✅ When keyword matching fails

#### When NOT to Use
- ❌ Quick factual lookups
- ❌ Shopping/product searches
- ❌ Local business searches
- ❌ Real-time news (better suited: Serper/Tavily)

#### Pricing (as of 2024)
| Tier | Queries | Price |
|------|---------|-------|
| Free | 1,000/mo | $0 |
| Pay-as-you-go | Variable | ~$0.001/query |
| Enterprise | Custom | Contact |

**Cost per query:** ~$0.001

#### Getting Your API Key
1. Go to [exa.ai](https://exa.ai)
2. Sign up with email or Google
3. Navigate to API section in dashboard
4. Copy your API key
5. Set `EXA_API_KEY` environment variable

---

## Configuration Guide

### Environment Variables

Create a `.env` file or set these in your shell:

```bash
# Required: Set at least one
export SERPER_API_KEY="your-serper-key"
export TAVILY_API_KEY="your-tavily-key"
export EXA_API_KEY="your-exa-key"
```

### Config File (Optional)

Create `config.json` in the skill directory to set default preferences:

```json
{
  "defaults": {
    "provider": "serper",
    "max_results": 5
  },
  "serper": {
    "country": "us",
    "language": "en"
  },
  "tavily": {
    "depth": "basic",
    "topic": "general"
  },
  "exa": {
    "type": "neural"
  }
}
```

### Validation

The script validates API keys and provides helpful errors:

```bash
$ python3 scripts/search.py -p serper -q "test"
# If key missing:
{"error": "Missing API key. Set SERPER_API_KEY environment variable.", "provider": "serper"}
```

---

## Usage Examples

### Basic Searches

```bash
# Serper - Google search
python3 scripts/search.py -p serper -q "best laptop 2024"

# Tavily - Research search
python3 scripts/search.py -p tavily -q "how does mRNA vaccine work"

# Exa - Semantic search
python3 scripts/search.py -p exa -q "startups building AI coding assistants"
```

### Serper Options

```bash
# Different search types
python3 scripts/search.py -p serper -q "gaming monitor" --type shopping
python3 scripts/search.py -p serper -q "coffee shop" --type places
python3 scripts/search.py -p serper -q "AI news" --type news
python3 scripts/search.py -p serper -q "cute cats" --type images

# With time filter
python3 scripts/search.py -p serper -q "OpenAI news" --time-range day
python3 scripts/search.py -p serper -q "tech layoffs" --time-range week

# Include images
python3 scripts/search.py -p serper -q "iPhone 16 Pro" --images

# Different locale
python3 scripts/search.py -p serper -q "weather" --country us --language en
python3 scripts/search.py -p serper -q "Wetter Wien" --country at --language de
```

### Tavily Options

```bash
# Deep research mode
python3 scripts/search.py -p tavily -q "quantum computing applications" --depth advanced

# News topic
python3 scripts/search.py -p tavily -q "climate policy" --topic news

# With full page content
python3 scripts/search.py -p tavily -q "transformer architecture" --raw-content

# Domain filtering
python3 scripts/search.py -p tavily -q "AI research" --include-domains arxiv.org nature.com
python3 scripts/search.py -p tavily -q "product reviews" --exclude-domains reddit.com

# Combined options
python3 scripts/search.py -p tavily -q "machine learning trends" \
  --depth advanced --topic general --max-results 10 --images
```

### Exa Options

```bash
# Neural vs keyword search
python3 scripts/search.py -p exa -q "companies like Stripe" --exa-type neural
python3 scripts/search.py -p exa -q "Stripe API documentation" --exa-type keyword

# Category filtering
python3 scripts/search.py -p exa -q "AI startups Series A" --category company
python3 scripts/search.py -p exa -q "attention mechanism" --category "research paper"
python3 scripts/search.py -p exa -q "React hooks tutorial" --category github
python3 scripts/search.py -p exa -q "tech industry thoughts" --category tweet

# Date filtering
python3 scripts/search.py -p exa -q "YC companies" --start-date 2024-01-01
python3 scripts/search.py -p exa -q "AI announcements" --start-date 2024-06-01 --end-date 2024-12-31

# Find similar pages
python3 scripts/search.py -p exa --similar-url "https://openai.com"
python3 scripts/search.py -p exa --similar-url "https://stripe.com" --category company

# Domain filtering
python3 scripts/search.py -p exa -q "startup news" --include-domains techcrunch.com ycombinator.com
```

---

## Workflow Examples

### 🛒 Product Research Workflow

**Goal:** Research a product before purchasing

```bash
# Step 1: Get product specs (Serper - Google's knowledge graph)
python3 scripts/search.py -p serper -q "MacBook Pro M3 Max specs" --max-results 3

# Step 2: Check current prices (Serper - Shopping)
python3 scripts/search.py -p serper -q "MacBook Pro M3 Max price" --type shopping

# Step 3: Find in-depth reviews (Tavily - Full content)
python3 scripts/search.py -p tavily -q "MacBook Pro M3 Max review 2024" \
  --depth advanced --include-domains theverge.com arstechnica.com

# Step 4: Get images (Serper)
python3 scripts/search.py -p serper -q "MacBook Pro M3 Max" --images
```

### 📚 Academic Research Workflow

**Goal:** Research a technical topic thoroughly

```bash
# Step 1: Get foundational understanding (Tavily)
python3 scripts/search.py -p tavily -q "transformer architecture deep learning" \
  --depth advanced --raw-content

# Step 2: Find recent papers (Exa - Research papers)
python3 scripts/search.py -p exa -q "transformer improvements efficiency" \
  --category "research paper" --start-date 2023-01-01

# Step 3: Find related papers to a key paper (Exa - Similar)
python3 scripts/search.py -p exa --similar-url "https://arxiv.org/abs/1706.03762"

# Step 4: Find implementations (Exa - GitHub)
python3 scripts/search.py -p exa -q "transformer implementation pytorch" --category github
```

### 📰 News Monitoring Workflow

**Goal:** Stay updated on a topic

```bash
# Step 1: Breaking news (Serper - Fast, real-time)
python3 scripts/search.py -p serper -q "OpenAI news" --type news --time-range day

# Step 2: In-depth coverage (Tavily - News topic)
python3 scripts/search.py -p tavily -q "OpenAI latest developments" \
  --topic news --depth advanced

# Step 3: Industry reactions (Exa - Tweets)
python3 scripts/search.py -p exa -q "OpenAI announcement reactions" --category tweet

# Step 4: Analysis pieces (Tavily - Specific sources)
python3 scripts/search.py -p tavily -q "OpenAI analysis" \
  --include-domains stratechery.com theinformation.com
```

### 🖼️ Image Search Workflow

**Goal:** Find images for a project

```bash
# Step 1: General image search (Serper)
python3 scripts/search.py -p serper -q "minimalist logo design" --type images

# Step 2: Get images with context (Serper)
python3 scripts/search.py -p serper -q "modern office interior design" --images

# Step 3: Find image sources with context (Tavily)
python3 scripts/search.py -p tavily -q "stock photo websites free commercial use" --images
```

### 🔍 Similar Page Discovery Workflow

**Goal:** Find companies/pages similar to a reference

```bash
# Step 1: Find companies similar to a known one (Exa)
python3 scripts/search.py -p exa --similar-url "https://notion.so" --category company

# Step 2: Find similar products
python3 scripts/search.py -p exa --similar-url "https://figma.com" --max-results 10

# Step 3: Find similar content/blogs
python3 scripts/search.py -p exa --similar-url "https://paulgraham.com" --category "personal site"

# Step 4: Research the discovered companies (Tavily)
python3 scripts/search.py -p tavily -q "Coda vs Notion comparison" --depth advanced
```

### 🏢 Competitive Analysis Workflow

**Goal:** Research competitors in a space

```bash
# Step 1: Find competitors (Exa - Company discovery)
python3 scripts/search.py -p exa -q "project management software startups" --category company

# Step 2: Find recent funding news (Exa - Date filtered)
python3 scripts/search.py -p exa -q "project management startup funding" \
  --category news --start-date 2024-01-01

# Step 3: Deep dive on specific competitor (Tavily)
python3 scripts/search.py -p tavily -q "Monday.com vs Asana features comparison" \
  --depth advanced --raw-content

# Step 4: Find user reviews (Serper)
python3 scripts/search.py -p serper -q "Monday.com reviews" --type search
```

---

## Optimization Tips

### Cost Optimization

| Tip | Savings |
|-----|---------|
| Use Serper for quick lookups | Cheapest per query |
| Use Tavily `basic` depth first, `advanced` only when needed | ~50% cost reduction |
| Set appropriate `max_results` (don't over-fetch) | Linear cost savings |
| Cache results for repeated queries | 100% on duplicates |
| Use Exa's free tier for semantic searches | 1,000 free/month |

### Performance Optimization

| Tip | Impact |
|-----|--------|
| Serper is fastest (~200ms) | Use for time-sensitive queries |
| Tavily `basic` is faster than `advanced` | ~2x faster |
| Exa `keyword` is faster than `neural` | ~1.5x faster |
| Lower `max_results` = faster response | Linear improvement |

### Quality Optimization

| Goal | Recommendation |
|------|----------------|
| Best factual accuracy | Serper (Google's quality) |
| Best research synthesis | Tavily with `advanced` depth |
| Best semantic matching | Exa with `neural` type |
| Best for recent content | Exa with date filters |
| Best for specific domains | Tavily with domain filters |

### Provider Selection Quick Guide

```
Is it a quick fact/product/local search?
  └─ YES → Serper
  └─ NO → Continue

Do you need full article content or synthesized answers?
  └─ YES → Tavily
  └─ NO → Continue

Is it a conceptual/semantic query or finding similar pages?
  └─ YES → Exa
  └─ NO → Serper (default)
```

---

## FAQ & Troubleshooting

### General Questions

**Q: Which provider should I start with?**
> Start with Serper for most queries — it's the most versatile and has the largest free tier (2,500 queries). Use Tavily for research and Exa for semantic/discovery tasks.

**Q: Can I use multiple providers in one workflow?**
> Yes! That's the recommended approach. Use Serper for quick lookups, Tavily for deep dives, and Exa for discovery. See [Workflow Examples](#workflow-examples).

**Q: How do I reduce API costs?**
> 1. Use the cheapest provider for each task type
> 2. Start with lower `max_results` and increase if needed
> 3. Use Tavily `basic` before trying `advanced`
> 4. Cache results for repeated queries

**Q: What's the difference between Exa neural and keyword search?**
> - **Neural:** Understands meaning/concepts ("companies like Uber for pets")
> - **Keyword:** Traditional matching ("uber pets company")
> Use neural for conceptual queries, keyword for specific terms.

### Troubleshooting

**Error: "Missing API key"**
```bash
# Check if key is set
echo $SERPER_API_KEY

# Set it
export SERPER_API_KEY="your-key"

# Or use .env file
echo 'SERPER_API_KEY=your-key' >> .env
source .env
```

**Error: "API Error (401)"**
> Your API key is invalid or expired. Generate a new one from the provider's dashboard.

**Error: "API Error (429)"**
> Rate limited. Wait a moment or upgrade your plan.

**Error: "Network Error"**
> Check your internet connection. The APIs require outbound HTTPS access.

**Empty results?**
> - Try a different provider
> - Broaden your query
> - Remove restrictive filters (domains, dates, categories)
> - Check if the query makes sense for that provider

**Slow responses?**
> - Reduce `max_results`
> - Use Tavily `basic` instead of `advanced`
> - Use Exa `keyword` instead of `neural`
> - Try Serper (fastest)

### Provider-Specific Issues

**Serper: Results in wrong language**
```bash
# Explicitly set country and language
python3 scripts/search.py -p serper -q "news" --country us --language en
```

**Tavily: Not getting full content**
```bash
# Enable raw content extraction
python3 scripts/search.py -p tavily -q "article" --raw-content --depth advanced
```

**Exa: Not finding recent content**
```bash
# Add date filter for recent content
python3 scripts/search.py -p exa -q "AI news" --start-date 2024-01-01
```

---

## API Reference

### Output Format

All providers return unified JSON:

```json
{
  "provider": "serper|tavily|exa",
  "query": "original search query",
  "results": [
    {
      "title": "Page Title",
      "url": "https://example.com/page",
      "snippet": "Content excerpt or description...",
      "score": 0.95,
      "date": "2024-01-15",
      "raw_content": "Full page content (if requested)"
    }
  ],
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "answer": "Synthesized answer (Tavily) or top snippet",
  "knowledge_graph": {
    "title": "Entity name",
    "type": "Product|Company|Person",
    "description": "Knowledge graph description",
    "attributes": {"key": "value"}
  }
}
```

### CLI Options Reference

| Option | Providers | Description |
|--------|-----------|-------------|
| `-p, --provider` | All | Provider: serper, tavily, exa |
| `-q, --query` | All | Search query |
| `-n, --max-results` | All | Max results (default: 5) |
| `--images` | Serper, Tavily | Include images |
| `--country` | Serper | Country code (us, uk, ca, au, de, fr, es, it, at, etc.) (default: us) |
| `--language` | Serper | Language code (en, de, fr, es, it, nl, pt, ru, zh, ja, ko, etc.) (default: en) |
| `--type` | Serper | search/news/images/videos/places/shopping |
| `--time-range` | Serper | hour/day/week/month/year |
| `--depth` | Tavily | basic/advanced |
| `--topic` | Tavily | general/news |
| `--raw-content` | Tavily | Include full page content |
| `--exa-type` | Exa | neural/keyword |
| `--category` | Exa | company/research paper/news/pdf/github/tweet/personal site/linkedin profile |
| `--start-date` | Exa | Start date (YYYY-MM-DD) |
| `--end-date` | Exa | End date (YYYY-MM-DD) |
| `--similar-url` | Exa | Find similar pages |
| `--include-domains` | Tavily, Exa | Only these domains |
| `--exclude-domains` | Tavily, Exa | Exclude these domains |

---

## License

MIT

---

## Links

- [Serper](https://serper.dev) — Google Search API
- [Tavily](https://tavily.com) — AI Research Search
- [Exa](https://exa.ai) — Neural Search
- [ClawdHub](https://clawdhub.com) — Clawdbot Skills
