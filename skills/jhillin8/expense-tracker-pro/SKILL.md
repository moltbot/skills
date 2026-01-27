---
name: expense-tracker-pro
description: Track expenses via natural language, get spending summaries, set budgets
author: clawd-team
version: 1.0.0
triggers:
  - "log expense"
  - "track spending"
  - "what did I spend"
  - "budget check"
  - "expense report"
---

# Expense Tracker Pro

Track your spending with natural conversation. No apps, no spreadsheets—just tell Clawd what you spent.

## What it does

Logs expenses from natural language ("spent $45 on groceries"), categorizes automatically, tracks against budgets, and provides spending summaries on demand. Data persists in your local Clawd memory.

## Usage

**Log an expense:**
```
"Spent $23.50 on lunch"
"$150 for electricity bill"
"Coffee $4.75"
```

**Check spending:**
```
"What did I spend this week?"
"Show my food expenses this month"
"Am I over budget on entertainment?"
```

**Set budgets:**
```
"Set grocery budget to $400/month"
"Budget $100 for entertainment"
```

**Get reports:**
```
"Monthly expense breakdown"
"Compare spending to last month"
"Export expenses to CSV"
```

## Categories

Auto-detected from context:
- Food & Dining
- Transportation
- Utilities
- Entertainment
- Shopping
- Health
- Subscriptions
- Other

Override with: "spent $50 on [item], category: [category]"

## Tips

- Be specific with amounts for accurate tracking
- Say "recurring" for subscriptions: "$15 Netflix, recurring monthly"
- Ask "spending trends" for insights over time
- All data stays local on your machine
