---
name: code-reviewer
description: AI code review for staged git changes. Use when you want a second pair of eyes before committing.
---

# Code Reviewer

Code review is one of those things that makes everything better but nobody has enough time for. This tool runs an AI-powered review on your staged git changes. It looks at your diff, identifies potential bugs, suggests improvements, and catches things you might miss when you're deep in the code. Like having a senior dev look over your shoulder, except it's instant and doesn't judge you.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-code-review
```

## What It Does

- Reviews your staged git changes automatically
- Identifies potential bugs, logic errors, and anti-patterns
- Suggests concrete improvements with explanations
- Checks for common security issues in your diff
- Works in any git repository without setup

## Usage Examples

```bash
# Review your staged changes
git add -A
npx ai-code-review

# Stage specific files and review
git add src/auth.ts src/middleware.ts
npx ai-code-review
```

## Best Practices

- **Stage before you run** - The tool reviews staged changes only. Run git add first, then review.
- **Use it before opening PRs** - Catch the obvious stuff before your teammates have to point it out.
- **Don't skip the suggestions** - Even if you disagree, take a second to think about why it was flagged.
- **Small commits, better reviews** - Smaller diffs get more useful feedback. Keep it focused.

## When to Use This

- Right before opening a pull request
- When you're working solo and don't have a reviewer
- Late night coding sessions when your brain is tired
- Quick sanity check on a tricky refactor

## How It Works

The tool uses simple-git to read your staged diff, then sends it to an AI model for analysis. It looks for bugs, anti-patterns, security issues, and style problems. Results come back with specific line references and actionable suggestions.

## Requirements

No install needed. Just run with npx. Node.js 18+ recommended. Must be inside a git repository with staged changes.

```bash
npx ai-code-review --help
```

## Part of the LXGIC Dev Toolkit

This is one of 110+ free developer tools built by LXGIC Studios. No paywalls, no sign-ups, no API keys on free tiers. Just tools that work.

**Find more:**
- GitHub: https://github.com/LXGIC-Studios
- Twitter: https://x.com/lxgicstudios
- Substack: https://lxgicstudios.substack.com
- Website: https://lxgic.dev

## License

MIT. Free forever. Use it however you want.