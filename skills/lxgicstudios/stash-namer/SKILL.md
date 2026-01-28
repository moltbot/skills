---
name: stash-namer
description: Name your git stashes meaningfully using AI. Use when you want to find your stashes later.
---

# Stash Namer

"WIP" and "temp changes" tell you nothing. This tool names your stashes based on what you actually changed. Finally find the right stash without popping them all.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-stash-name
```

## What It Does

- Analyzes your staged/unstaged changes
- Generates a descriptive stash name
- Stashes with the generated message
- Makes git stash list actually useful

## Usage Examples

```bash
# Stash current changes with a good name
npx ai-stash-name

# Preview the name without stashing
npx ai-stash-name --dry-run

# Include untracked files
npx ai-stash-name --include-untracked

# Custom prefix for team conventions
npx ai-stash-name --prefix "WIP:"
```

## Best Practices

- **Stash often with names** - Small, named stashes are easier to manage
- **Include the ticket** - Use --prefix with your ticket number
- **Review before popping** - The name tells you what's in there
- **Clean up old stashes** - Named stashes are still stashes, don't hoard them

## When to Use This

- Quick context switch but don't want to commit
- Experimenting and want to save progress
- Multiple work-in-progress changes across features
- Team uses shared branches and you need clear stash names

## Part of the LXGIC Dev Toolkit

This is one of 110+ free developer tools built by LXGIC Studios. No paywalls, no sign-ups, no API keys on free tiers. Just tools that work.

**Find more:**
- GitHub: https://github.com/LXGIC-Studios
- Twitter: https://x.com/lxgicstudios
- Substack: https://lxgicstudios.substack.com
- Website: https://lxgic.dev

## Requirements

No install needed. Just run with npx. Node.js 18+ recommended. Requires OPENAI_API_KEY environment variable.

```bash
export OPENAI_API_KEY=sk-...
npx ai-stash-name --help
```

## How It Works

Runs git diff to see what changed, sends the diff summary to GPT, and gets back a concise, descriptive name. Then runs git stash push -m with that name. Simple but solves a real annoyance.

## License

MIT. Free forever. Use it however you want.
