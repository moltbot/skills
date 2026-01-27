---
name: fitbit
description: Query Fitbit health data (activity, sleep, heart rate, weight) via CLI. Use when answering health/fitness questions that require Fitbit data, or when the user asks about their steps, sleep, heart rate, or weight from Fitbit.
metadata: {"clawdbot":{"emoji":"💪","requires":{"bins":["fitbit"]}}}
---

# Fitbit CLI

Retrieve health and fitness data from Fitbit's Web API.

## Setup

1. Register an app at https://dev.fitbit.com/apps
   - OAuth 2.0 Application Type: **Personal**
   - Callback URL: `http://localhost:18787/callback`
2. Run `fitbit configure` and enter your Client ID
3. Run `fitbit login` to authorize

## Quick Reference

```bash
# Setup & auth
fitbit configure              # Set client ID (first time)
fitbit login                  # Authorize via browser
fitbit logout                 # Sign out
fitbit status                 # Check auth status

# Data
fitbit profile                # User profile info
fitbit activity [date]        # Daily activity summary
fitbit activity steps [date]  # Just steps
fitbit summary [date]         # Full daily summary
fitbit today                  # Today's summary (shortcut)
```

## Options

All commands support:
- `--json` — JSON output
- `--no-color` — Plain text output
- `--verbose` — Debug/HTTP details
- `--tz <zone>` — Override timezone (e.g., `America/Chicago`)

## Examples

```bash
# Get today's step count
fitbit activity steps

# Get yesterday's full summary as JSON
fitbit summary 2026-01-25 --json

# Check if authenticated
fitbit status
```

## Notes

- Dates default to today if omitted
- Date format: `YYYY-MM-DD` or `today`
- Tokens are stored in `~/.config/fitbit-cli/tokens.json` (chmod 600)
- Token refresh is automatic
