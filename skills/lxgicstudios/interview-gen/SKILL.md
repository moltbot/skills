---
name: interview-gen
description: Generate interview questions from your codebase. Use when hiring developers.
---

# Interview Generator

Generic interview questions tell you nothing. This tool reads your actual codebase and generates questions that test skills relevant to your project.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-interview ./src/
```

## What It Does

- Analyzes your codebase for technologies and patterns
- Generates relevant technical questions
- Supports different seniority levels
- Focuses on your actual stack

## Usage Examples

```bash
# Generate mid-level questions
npx ai-interview ./src/

# Senior-level questions
npx ai-interview ./src/ --level senior --count 15

# Save to file
npx ai-interview ./src/ -o questions.md

# Junior level
npx ai-interview ./src/ --level junior
```

## Best Practices

- **Match to role** - don't ask senior questions to juniors
- **Mix theory and practice** - both matter
- **Include follow-ups** - good questions lead to discussions
- **Update periodically** - as your stack evolves

## When to Use This

- Preparing for candidate interviews
- Standardizing technical screens
- Building question banks for your team
- Onboarding interviewers to your codebase

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
npx ai-interview --help
```

## How It Works

Scans your codebase to identify technologies, patterns, and complexity. Then generates interview questions that would test a candidate's ability to work on your specific project.

## License

MIT. Free forever. Use it however you want.
