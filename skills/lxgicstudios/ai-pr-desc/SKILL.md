---
name: pr-desc
description: Generate PR descriptions from your changes
---

# PR Description Generator

Stop writing PR descriptions by hand. This reads your changes and writes them for you.

## Quick Start

```bash
npx ai-pr-desc
```

## What It Does

- Analyzes your branch changes
- Generates structured PR description
- Lists what changed and why
- Identifies breaking changes
- Adds testing instructions

## Usage Examples

```bash
# Generate for current branch
npx ai-pr-desc

# Compare specific branches
npx ai-pr-desc --base main --head feature/auth

# Copy to clipboard
npx ai-pr-desc | pbcopy

# Include screenshots placeholder
npx ai-pr-desc --screenshots
```

## Output Format

```markdown
## What
Added user authentication with magic links

## Why
Users needed passwordless login option

## Changes
- New /api/auth/magic-link endpoint
- Email template for magic links
- Token verification middleware

## Testing
1. Go to /login
2. Enter email
3. Check email for magic link
4. Click link to authenticate

## Breaking Changes
None
```

## Requirements

Node.js 18+. OPENAI_API_KEY required. Must be in git repo.

## License

MIT. Free forever.

---

**Built by LXGIC Studios**

- GitHub: [github.com/lxgicstudios/ai-pr-desc](https://github.com/lxgicstudios/ai-pr-desc)
- Twitter: [@lxgicstudios](https://x.com/lxgicstudios)
