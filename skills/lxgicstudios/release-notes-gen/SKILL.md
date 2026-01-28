---
name: release-notes-gen
description: Turn git history into readable release notes. Use when publishing releases.
---

# Release Notes Generator

Commit messages are for developers. Release notes are for users. This tool turns your messy git log into clean, grouped release notes.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-release-notes --from v1.0.0
```

## What It Does

- Reads commits or changelog files
- Groups changes by category
- Cleans up technical jargon
- Supports different tones

## Usage Examples

```bash
# From git history
npx ai-release-notes --from v1.0.0

# Make it fun
npx ai-release-notes --from v1.0.0 --tone fun

# Between two tags
npx ai-release-notes --from v1.0.0 --to v2.0.0

# From changelog file
npx ai-release-notes --changelog CHANGELOG.md
```

## Best Practices

- **Write for your audience** - users don't care about internal refactors
- **Highlight breaking changes** - make them impossible to miss
- **Group related changes** - features, fixes, improvements
- **Be consistent** - same format every release

## When to Use This

- Publishing GitHub releases
- Writing blog posts about updates
- Communicating with users
- Creating marketing changelogs

## Part of the LXGIC Dev Toolkit

This is one of 110+ free developer tools built by LXGIC Studios. No paywalls, no sign-ups, no API keys on free tiers. Just tools that work.

**Find more:**
- GitHub: https://github.com/LXGIC-Studios
- Twitter: https://x.com/lxgicstudios
- Substack: https://lxgicstudios.substack.com
- Website: https://lxgicstudios.com

## Requirements

No install needed. Just run with npx. Node.js 18+ recommended. Needs OPENAI_API_KEY environment variable.

```bash
npx ai-release-notes --help
```

## How It Works

Reads your git history or changelog, parses the technical changes, and rewrites them in user-friendly language. Supports different tones from professional to casual.

## License

MIT. Free forever. Use it however you want.
