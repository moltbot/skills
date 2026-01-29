---
name: code-explain
description: Explain complex code in plain English
---

# Code Explainer

Paste confusing code, get a clear explanation. Works with any language.

## Quick Start

```bash
npx ai-explain ./src/utils/crypto.ts
```

## What It Does

- Explains what code does line by line
- Identifies patterns and algorithms
- Explains why code is written that way
- Suggests improvements

## Usage Examples

```bash
# Explain a file
npx ai-explain ./src/auth/jwt.ts

# Explain from stdin
cat weird-regex.js | npx ai-explain

# Explain with context
npx ai-explain ./src/api.ts --context "This handles payments"

# Different detail levels
npx ai-explain ./src/algo.ts --detail high
```

## Output Includes

- High-level summary
- Step-by-step breakdown
- Key concepts explained
- Potential issues flagged

## Great For

- Understanding inherited code
- Learning new patterns
- Code review prep
- Onboarding new devs

## Requirements

Node.js 18+. OPENAI_API_KEY required.

## License

MIT. Free forever.

---

**Built by LXGIC Studios**

- GitHub: [github.com/lxgicstudios/ai-explain](https://github.com/lxgicstudios/ai-explain)
- Twitter: [@lxgicstudios](https://x.com/lxgicstudios)
