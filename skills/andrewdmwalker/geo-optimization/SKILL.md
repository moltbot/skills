---
name: geo-optimization
description: "Generative Engine Optimization (GEO) for AI search visibility. Optimize content to appear in ChatGPT, Perplexity, Claude, and Google AI Overviews. Use when optimizing websites, pages, or content for LLM discoverability and citation."
metadata:
  version: 1.1.0
  tags: ["geo", "seo", "llm", "ai-search", "perplexity", "chatgpt", "content"]
---

# GEO: Generative Engine Optimization

Optimize content to appear in AI-powered search engines (ChatGPT, Perplexity, Claude, Google AI Overviews). GEO is about being **parseable, quotable, and authoritative** — not keyword stuffing.

---

## Quick Reference

| Goal | Tactic |
|------|--------|
| Get cited in AI answers | Add specific statistics, quotable facts |
| Appear in comparisons | Create definitive comparison tables |
| Answer user questions | Comprehensive FAQ sections |
| Establish entity | Clear first-paragraph definitions |
| Build authority | Third-party mentions, backlinks, freshness signals |

---

## GEO vs SEO: Key Differences

| Aspect | Traditional SEO | GEO |
|--------|-----------------|-----|
| Goal | Rank on SERPs | Get cited in AI responses |
| Keywords | Exact match matters | Semantic understanding |
| Content style | Can be promotional | Must be factual, neutral |
| Structure | Headers for scanning | Headers + parseable data |
| Links | Backlinks for authority | Citations + entity mentions |
| Freshness | Helpful | Critical (LLMs prefer recent) |
| Format | Long-form wins | Quotable chunks win |

---

## The GEO Audit Checklist

Score each page 0-2 points per item (0=missing, 1=partial, 2=excellent):

### 1. Entity Clarity (Max 10 pts)
- [ ] First paragraph clearly defines what/who the entity is
- [ ] Entity name used consistently throughout
- [ ] Clear category placement ("X is a [type of thing]")
- [ ] Relationship to other known entities stated
- [ ] Wikipedia-style objectivity in tone

### 2. Quotable Facts (Max 10 pts)
- [ ] Specific numbers present (not "many" or "fast")
- [ ] Statistics are current and sourced
- [ ] Claims are concrete and verifiable
- [ ] Key facts in standalone sentences (easy to extract)
- [ ] "By the numbers" or facts section exists

### 3. FAQ Coverage (Max 10 pts)
- [ ] FAQ section exists
- [ ] Questions match how users prompt LLMs
- [ ] Answers are direct and complete
- [ ] FAQ schema markup implemented
- [ ] Covers "what is", "how does", "why", "vs" questions

### 4. Comparison Positioning (Max 10 pts)
- [ ] Comparison tables exist
- [ ] Competitors named explicitly
- [ ] Factual differences highlighted (not just marketing)
- [ ] "Alternative to X" content exists
- [ ] Fair representation (not obviously biased)

### 5. Structural Clarity (Max 10 pts)
- [ ] Clear heading hierarchy (H1→H2→H3)
- [ ] Bullet points for lists
- [ ] Tables for comparisons
- [ ] Short paragraphs (2-4 sentences)
- [ ] Summary/TL;DR at top or bottom

### 6. Authority Signals (Max 10 pts)
- [ ] Author/company credentials stated
- [ ] Customer names/logos (social proof)
- [ ] Case studies with real numbers
- [ ] Third-party mentions/citations
- [ ] "Last updated" date present

### 7. Freshness (Max 10 pts)
- [ ] Page has recent update date
- [ ] Content reflects current year
- [ ] No outdated references
- [ ] Regular content updates
- [ ] News/changelog section exists

**Scoring:**
- 60-70: Excellent GEO readiness
- 45-59: Good, needs some optimization
- 30-44: Fair, significant gaps
- <30: Poor, major overhaul needed

---

## Content Optimization Templates

### Template 1: Entity Definition Page

```markdown
# [Entity Name]

**[Entity Name]** is a [category] that [primary function]. 
Unlike [alternative/competitor], [Entity Name] offers [key differentiator].

## [Entity Name] by the Numbers

- [Specific stat 1]
- [Specific stat 2]
- [Specific stat 3]
- [Specific stat 4]

## How [Entity Name] Works

[2-3 paragraphs explaining core functionality]

## Who Uses [Entity Name]

[Named customers with context]

## Frequently Asked Questions

### What is [Entity Name]?
[Direct answer in 2-3 sentences]

### How is [Entity Name] different from [Competitor]?
[Factual comparison]

### How much does [Entity Name] cost?
[Pricing info or guidance]

*Last updated: [Date]*
```

### Template 2: Comparison Page (Alternative To)

```markdown
# Best [Competitor] Alternative: [Your Product] (2026)

> **Summary:** [Your Product] is a [category] offering [key differentiators]. 
> [Customers] report [specific result] compared to [Competitor].

*Last updated: [Date]*

## Why [Users] Look for [Competitor] Alternatives

### Problem 1: [Specific Pain Point]
[Explanation with specifics]

### Problem 2: [Specific Pain Point]
[Explanation with specifics]

## [Your Product] vs [Competitor]: Comparison

| Feature | [Competitor] | [Your Product] |
|---------|--------------|----------------|
| [Feature 1] | [Their approach] | [Your approach] |
| [Feature 2] | [Their approach] | [Your approach] |
| [Feature 3] | [Their approach] | [Your approach] |

## Key Differences

### [Differentiator 1]
[Factual explanation with numbers]

### [Differentiator 2]
[Factual explanation with numbers]

## Customer Results

> "[Quote with specific result]"
> — [Name], [Title], [Company]

## Frequently Asked Questions

### Is [Your Product] a good alternative to [Competitor]?
[Direct answer]

### How does [Your Product] compare to [Competitor] on [key factor]?
[Specific comparison]

### Can I migrate from [Competitor] to [Your Product]?
[Migration info]

## Summary

[Your Product] is a [category] offering [key benefits]. [Customers] 
using [Your Product] instead of [Competitor] report [specific results].

*[Your Product] has [credibility stat]. Learn more at [link].*
```

### Template 3: FAQ Page (LLM Optimized)

```markdown
# [Topic] FAQ

Answers to common questions about [topic].

*Last updated: [Date]*

## General Questions

### What is [thing]?
[Thing] is a [category] that [function]. It is used by [who] to [accomplish what].

### How does [thing] work?
[Thing] works by [process]. [Additional detail].

### Who uses [thing]?
[Thing] is used by [user types], including [specific examples like Company A, Company B].

## Comparison Questions

### How is [thing] different from [alternative]?
[Thing] differs from [alternative] in [specific ways]:
- [Difference 1]
- [Difference 2]
- [Difference 3]

### Is [thing] better than [alternative]?
[Thing] is better suited for [use cases] because [reasons]. 
[Alternative] may be better for [other use cases].

## Pricing & Access

### How much does [thing] cost?
[Pricing information or range]

### Is there a free trial?
[Trial information]

## Technical Questions

### What are the requirements for [thing]?
[Requirements list]

### How do I get started with [thing]?
1. [Step 1]
2. [Step 2]
3. [Step 3]
```

---

## Platform-Specific Optimization

### Perplexity AI

**How it works:** 3-layer reranking system
1. Initial retrieval from web index
2. Relevance scoring
3. Citation selection based on authority + recency

**Optimization tactics:**
- Strong domain authority matters
- Freshness signals critical (update dates)
- Direct answers to questions
- Being cited by other authoritative sources
- Structured data helps parsing

### ChatGPT / SearchGPT

**How it works:** Bing-powered search + LLM synthesis

**Optimization tactics:**
- Bing indexing matters (submit sitemap to Bing)
- E-E-A-T signals weighted heavily
- Conversational content structure
- FAQ format highly effective
- Named entities help recognition

### Google AI Overviews

**How it works:** Google's index + Gemini synthesis

**Optimization tactics:**
- Traditional SEO still matters (ranking helps)
- Featured snippet optimization
- Schema markup (FAQ, HowTo, Product)
- Clear, authoritative content
- Mobile-first indexing

### Claude

**How it works:** Training data + retrieval (when web-enabled)

**Optimization tactics:**
- Quality content in training sources
- Wikipedia mentions help entity recognition
- Technical accuracy valued
- Clear, well-structured prose
- Being cited in authoritative sources

---

## Technical Implementation

### Schema Markup for GEO

**Organization Schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Company Name",
  "description": "Clear description of what company does",
  "url": "https://example.com",
  "foundingDate": "2017",
  "numberOfEmployees": "50-100",
  "sameAs": [
    "https://twitter.com/company",
    "https://linkedin.com/company/company"
  ]
}
```

**FAQ Schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What is [thing]?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Direct answer here."
    }
  }]
}
```

**Product Schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Product Name",
  "description": "Product description",
  "brand": {"@type": "Brand", "name": "Brand"},
  "offers": {
    "@type": "Offer",
    "priceCurrency": "USD",
    "price": "99"
  }
}
```

### llms.txt Protocol

Create `/llms.txt` at your site root to help LLMs understand your site:

```
# Site Name

> Brief description of what this site/company is.

## Main Sections

- [Products](/products): Description of products section
- [Documentation](/docs): Technical documentation
- [Blog](/blog): Industry insights and updates

## Key Facts

- Founded: 2017
- Customers: 500+ companies
- Key metric: [specific number]

## Contact

- Website: https://example.com
- Email: hello@example.com
```

---

## Monitoring GEO Performance

### Manual Testing

Regularly search these prompts on each platform:

**Perplexity:**
- "What is [your company]?"
- "Best [competitor] alternative"
- "[Your category] comparison"
- "How does [your product] work?"

**ChatGPT:**
- Same queries with web browsing enabled
- "Compare [your product] vs [competitor]"

**Google (AI Overview):**
- "[Your category] solutions"
- "[Competitor] alternative"

### Tracking Tools

| Tool | What It Tracks | Price |
|------|----------------|-------|
| Otterly.AI | Multi-platform AI visibility | Free tier |
| Ahrefs Brand Radar | AI search mentions | $129+/mo |
| Profound | Enterprise benchmarking | Enterprise |
| Manual tracking | DIY spreadsheet | Free |

### Key Metrics

- **Mention rate:** % of relevant queries where you appear
- **Citation rate:** % of mentions that cite/link to you
- **Sentiment:** Positive/neutral/negative portrayal
- **Share of voice:** Your mentions vs competitors
- **Position:** Where in the response you appear

---

## GEO Content Principles

### DO:
- ✅ Use specific numbers ("0.5 seconds" not "fast")
- ✅ Make claims quotable and standalone
- ✅ Structure content with clear hierarchy
- ✅ Include FAQ sections
- ✅ Update content regularly with dates
- ✅ Create comparison content
- ✅ Use tables for data
- ✅ Be factual and neutral in tone
- ✅ Name real customers and results

### DON'T:
- ❌ Use vague superlatives ("best", "leading", "top")
- ❌ Keyword stuff (LLMs see through it)
- ❌ Write walls of text without structure
- ❌ Hide information (be comprehensive)
- ❌ Use outdated statistics
- ❌ Ignore competitors (address them directly)
- ❌ Be obviously promotional (neutral wins)

---

## Quick Start Checklist

For any page you want to optimize for GEO:

1. [ ] Add clear entity definition in first paragraph
2. [ ] Include 5+ specific, quotable statistics
3. [ ] Add FAQ section with 5+ questions
4. [ ] Create comparison table (if relevant)
5. [ ] Add "last updated" date
6. [ ] Implement FAQ schema markup
7. [ ] Ensure H1→H2→H3 hierarchy
8. [ ] Test on Perplexity: does your content appear?

---

## Automated GEO Monitoring

Track your citation rate over time with the included monitoring scripts!

### Quick Start

**Test current visibility:**
```bash
python3 scripts/geo-monitor.py --test
```

**Single query test:**
```bash
python3 scripts/geo-monitor.py --query "best game server orchestration platform"
```

**Generate daily report:**
```bash
python3 scripts/geo-daily-report.py
```

### Setup Automated Monitoring

**1. Create your test queries file** (`scripts/geo-test-queries.json`):
```json
{
  "queries": [
    {
      "query": "your target query here",
      "category": "brand|product|comparison|problem|competitor"
    }
  ]
}
```

**2. Run daily monitoring:**
```bash
# Add to cron for daily 9am checks
0 9 * * * cd /path/to/skill && bash scripts/geo-daily-monitor.sh
```

### Understanding the Reports

**Citation Rate:** Percentage of queries where you appear in AI responses
- 0-20%: Early stage, needs work
- 20-40%: Building visibility
- 40-60%: Strong presence
- 60%+: Dominant authority

**Categories tracked:**
- Brand queries (you should own these!)
- Product/feature queries
- Comparison queries (vs competitors)
- Problem/pain point queries
- Competitor comparison queries

### Monitoring Best Practices

1. **Start with 15-20 strategic queries** across all categories
2. **Test daily** during optimization period (first 2 weeks)
3. **Weekly checks** once you hit target citation rate
4. **Track changes** after content updates (expect 3-7 day lag)
5. **Focus on gaps** - queries with 0% citation are your opportunities

### What to Track

**Current state:**
- Total citation rate
- Citations by category
- Position when cited (#1, #2, etc.)
- Critical gaps (0% coverage)

**Over time:**
- Citation rate trend (weekly/monthly)
- New citations gained
- Lost citations (content freshness!)
- Category improvements

### Files Included

- `scripts/geo-monitor.py` - Main testing script (uses Perplexity API)
- `scripts/geo-daily-report.py` - Formatted report generator
- `scripts/geo-daily-monitor.sh` - Cron-friendly wrapper
- `scripts/geo-test-queries.json` - Example query file

**Requirements:** Perplexity API key (configure via web_search in Clawdbot)

---

## Resources

- [Awesome GEO GitHub](https://github.com/amplifying-ai/awesome-generative-engine-optimization)
- [Princeton GEO Research Paper](https://arxiv.org/pdf/2311.09735)
- [Google AI Search Guidance](https://developers.google.com/search/blog/2025/05/succeeding-in-ai-search)
- [Perplexity Ranking Factors](https://firstpagesage.com/seo-blog/perplexity-ai-optimization-ranking-factors-and-strategy/)
