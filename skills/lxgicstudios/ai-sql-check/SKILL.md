---
name: sql-check
description: Analyze SQL queries for performance and security issues
---

# SQL Checker

Paste your SQL, get performance tips and security warnings. Catches N+1s and injection risks.

## Quick Start

```bash
npx ai-sql-check "SELECT * FROM users WHERE name LIKE '%john%'"
```

## What It Does

- Identifies performance issues
- Flags SQL injection risks
- Suggests missing indexes
- Warns about N+1 queries

## Usage Examples

```bash
# Check a query
npx ai-sql-check "SELECT * FROM orders WHERE status = 'pending'"

# Check from file
npx ai-sql-check --file ./queries/report.sql

# With schema for better analysis
npx ai-sql-check --file query.sql --schema ./schema.sql
```

## Issues It Catches

- SELECT * anti-pattern
- Missing WHERE clause
- Unindexed columns in WHERE
- LIKE with leading wildcard
- Cartesian joins
- SQL injection patterns

## Output Example

```
⚠️ Performance Issues:
- SELECT * returns unnecessary columns
- LIKE '%john%' can't use index

🔒 Security Issues:
- None detected

💡 Suggestions:
- Add index on users(name)
- Select only needed columns
```

## Requirements

Node.js 18+. OPENAI_API_KEY required.

## License

MIT. Free forever.

---

**Built by LXGIC Studios**

- GitHub: [github.com/lxgicstudios/ai-sql-check](https://github.com/lxgicstudios/ai-sql-check)
- Twitter: [@lxgicstudios](https://x.com/lxgicstudios)
