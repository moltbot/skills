---
name: just-fucking-cancel
description: Analyze bank transaction CSVs to find recurring charges, categorize subscriptions, and cancel what you don't need. Use when user says "cancel subscriptions", "audit subscriptions", "find recurring charges", or "what am I paying for". Supports Apple Card, Chase, Mint, and generic CSV formats. Outputs interactive HTML audit with copy-to-cancel workflow.
attribution: Originally created by rohunvora (https://github.com/rohunvora/just-fucking-cancel)
---

# just-fucking-cancel

Analyze transactions, categorize subscriptions, generate HTML audit, help cancel.

## Triggers
- "cancel subscriptions", "audit subscriptions"
- "find recurring charges", "what am I paying for"
- "subscription audit", "clean up subscriptions"

## Workflow

### 1. Get Transaction CSV
Ask user for bank/card CSV export. Common sources:
- Apple Card: Wallet → Card Balance → Export
- Chase: Accounts → Download activity → CSV
- Mint: Transactions → Export

### 2. Analyze Recurring Charges
Read CSV, identify recurring patterns:
- Same merchant, similar amounts, monthly/annual frequency
- Flag subscription-like charges (streaming, SaaS, memberships)
- Note charge frequency and total annual cost

### 3. Categorize with User
For each subscription, ask user to categorize:
- **Cancel** - Stop immediately
- **Investigate** - Needs decision (unsure, trapped in contract)
- **Keep** - Intentional, continue paying

Ask in batches of 5-10 to avoid overwhelming.

### 4. Generate HTML Audit
Copy [template.html](assets/template.html) and populate:
- Update header summary:
  - Scope line: "found N subscriptions · N transactions"
  - Breakdown: "Cancelled N · Keeping N"
  - Savings: yearly amount big, monthly in parentheses
  - Timestamp: current date
- Add rows to appropriate sections (cancelled/investigate/keep)
- Include notes from user responses

Row templates in the HTML comments show the structure.

### 5. Cancel Subscriptions
When user checks items and copies from floating button, they'll paste:
`Cancel these: Service1 ($XX), Service2 ($XX)...`

For each service:
1. Check [common-services.md](references/common-services.md) for cancel URL
2. Use browser automation to navigate and cancel
3. Update HTML row to cancelled status with date

## HTML Structure

Three sections, auto-hide when empty:
- **Cancelled** (green badge, strikethrough) - Done items, the win
- **Needs Decision** (orange badge) - Has checkboxes for cancel selection
- **Keeping** (grey badge) - No checkboxes, just reference

Features:
- Floating copy button appears when items checked
- Privacy toggle blurs service names
- Collapsible sections via header click
- Dark mode support

## Cancellation Tips

For difficult services, see [common-services.md](references/common-services.md):
- Direct cancel URLs for 50+ services
- Dark pattern warnings (gym contracts, phone-only)
- Retention script responses
- Credit card dispute backup

## Privacy

All data stays local. Transaction CSVs are analyzed in-session only.
