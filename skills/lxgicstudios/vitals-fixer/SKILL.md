---
name: vitals-fixer
description: Fix Core Web Vitals issues with AI guidance. Use when your Lighthouse scores need improvement.
---

# Core Web Vitals Fixer

Your Lighthouse scores are red. This tool tells you exactly why and how to fix it. LCP, FID, CLS. all the acronyms, all the solutions. No more guessing at performance problems.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-core-vitals ./src
```

## What It Does

- Analyzes your code for Core Web Vitals issues
- Identifies LCP bottlenecks like render-blocking resources
- Finds CLS causes like images without dimensions
- Spots FID problems from heavy JavaScript execution
- Provides specific code changes, not just generic advice

## Usage Examples

```bash
# Full project analysis
npx ai-core-vitals ./

# Focus on specific metric
npx ai-core-vitals ./src --metric lcp

# Analyze with a URL for real data
npx ai-core-vitals ./src --url https://yoursite.com

# Prioritized fix list
npx ai-core-vitals ./src --prioritize

# Output detailed report
npx ai-core-vitals ./src -o vitals-report.md
```

## Best Practices

- **Fix LCP first** - It's the biggest impact on perceived performance
- **Measure before and after** - Run Lighthouse to validate your fixes
- **Don't trust dev mode** - Production builds behave differently. Test both
- **Focus on the biggest wins** - One large image fix beats ten micro-optimizations

## When to Use This

- Failed a Core Web Vitals assessment on Search Console
- Preparing for a Lighthouse audit
- Client complains the site feels slow
- Building performance regression tests

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
npx ai-core-vitals --help
```

## How It Works

The tool scans your source files for patterns known to hurt Web Vitals. It identifies specific issues like unoptimized images, missing preloads, layout-shifting elements, and heavy bundle imports. AI correlates these findings with your actual code to suggest targeted fixes.

## License

MIT. Free forever. Use it however you want.
