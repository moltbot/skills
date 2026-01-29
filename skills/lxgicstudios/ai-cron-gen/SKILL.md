---
name: cron-gen
description: Generate cron expressions from natural language
---

# Cron Generator

"Every weekday at 9am" to "0 9 * * 1-5". Stop googling cron syntax.

## Quick Start

```bash
npx ai-cron-gen "every monday at 3pm"
```

## What It Does

- Converts plain English to cron expressions
- Explains what the cron does
- Validates existing cron syntax
- Shows next execution times

## Usage Examples

```bash
# Generate from description
npx ai-cron-gen "first day of every month at midnight"

# Explain existing cron
npx ai-cron-gen --explain "0 */4 * * *"

# Get next 5 run times
npx ai-cron-gen "every 30 minutes" --next 5
```

## Output

```
Expression: 0 9 * * 1-5
Meaning: At 09:00 on every day-of-week from Monday through Friday
Next runs:
  - Mon Jan 29 09:00:00 2024
  - Tue Jan 30 09:00:00 2024
```

## Requirements

Node.js 18+. OPENAI_API_KEY required.

## License

MIT. Free forever.

---

**Built by LXGIC Studios**

- GitHub: [github.com/lxgicstudios/ai-cron-gen](https://github.com/lxgicstudios/ai-cron-gen)
- Twitter: [@lxgicstudios](https://x.com/lxgicstudios)
