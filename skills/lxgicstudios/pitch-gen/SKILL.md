---
name: pitch-gen
description: Generate startup pitch deck content with AI. Use when building investor decks or startup presentations.
---

# Pitch Gen

Need to pitch investors but staring at a blank deck? This tool generates pitch deck content. Problem statements, market sizing, business models, competitive analysis. All the slides that take forever to write.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-pitch "AI-powered code review platform for teams"
```

## What It Does

- Generates full pitch deck content from a single idea description
- Creates problem/solution slides with compelling narratives
- Builds market size estimates with TAM/SAM/SOM breakdowns
- Writes competitive positioning and moat analysis
- Produces business model and go-to-market slides

## Usage Examples

```bash
# Generate pitch content from an idea
npx ai-pitch "marketplace for freelance AI engineers"

# Specify output format
npx ai-pitch "B2B SaaS for inventory management" --format markdown

# Focus on specific sections
npx ai-pitch "mobile app for pet owners" --sections problem,solution,market
```

## Best Practices

- **Be specific about your idea** - "AI code review" is vague. "AI code review for security vulnerabilities in fintech" gives much better output.
- **Add context about your target market** - The tool can't read your mind about who you're selling to.
- **Use this as a starting point** - The output is a first draft. Your unique insights make it compelling.
- **Run multiple times** - Different runs give different angles. Pick the best bits from each.

## When to Use This

- Building your first pitch deck and don't know where to start
- Need to quickly prototype how an idea would pitch to investors
- Want a structure to fill in with your own research and data
- Brainstorming how to position your startup against competitors

## Part of the LXGIC Dev Toolkit

This is one of 110+ free developer tools built by LXGIC Studios. No paywalls, no sign-ups, no API keys on free tiers. Just tools that work.

**Find more:**
- GitHub: https://github.com/LXGIC-Studios
- Twitter: https://x.com/lxgicstudios
- Substack: https://lxgicstudios.substack.com
- Website: https://lxgic.dev

## Requirements

No install needed. Just run with npx. Node.js 18+ recommended.

```bash
npx ai-pitch --help
```

## How It Works

The tool takes your startup idea and runs it through a structured prompt that covers standard pitch deck sections. It uses GPT to generate investor-ready copy for each slide, following patterns from successful pitch decks.

## License

MIT. Free forever. Use it however you want.
