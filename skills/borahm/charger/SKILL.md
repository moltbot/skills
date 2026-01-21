---
name: charger
description: Check EV charger availability (favorites, nearby search) via Google Places.
metadata:
  clawdbot:
    config:
      requiredEnv:
        - GOOGLE_PLACES_API_KEY
      stateDirs:
        - config
        - .cache
---

# charger

Higher-level EV charger checker built on Google Places (New) EV charge data.

This skill includes a `bin/charger` CLI (Node.js) for checking charger availability.

## Setup

- Requirements:
  - Node.js 18+ (Clawdbot already has Node)
  - `GOOGLE_PLACES_API_KEY` (recommended in `~/.clawdbot/.env`)

- Put the CLI on your PATH (example):
  - `ln -sf "$(pwd)"/bin/charger /home/claw/clawd/bin/charger`

- Add a favorite:
  - `charger favorites add home --place-id <placeId>`

## Commands

- Check a favorite / place id / query:
  - `charger check home`
  - `charger check "Wien Energie Charging Station Liniengasse 2 1060 Wien"`

- Find nearby:
  - `charger nearby --lat 48.188472 --lng 16.348854 --radius 2000 --max 10`

## Notifications

The recommended pattern is:

1) `charger` (this skill) produces a clear `Any free: YES|NO` result.
2) A scheduled job (Gateway cron) runs a small helper that only prints output when it should notify.

### Helper script (what actually decides to notify)

This bundle includes `scripts/charger-notify.sh`.

What it does:
- Runs `charger check <target>`
- If `Any free: YES` **and** the last run was not `YES`, it prints a single notification line.
- Otherwise it prints **nothing**.

So: **no output = no notification**.

State:
- Stores last state in `~/.cache/charger-notify/<target>.state` so it only notifies on the change `NO/UNKNOWN → YES`.

Usage:
- `bash scripts/charger-notify.sh home`

Example notification output:
- `EV charger available: Tanke Wien Energie Charging Station — Amtshausgasse 9, 1050 Wien, Austria — 1/2 available (OOS 0) (updated 2026-01-21T21:05:00Z)`

### Typical cron schedule (how you actually get Telegram pings)

Cron is the scheduler. It runs the helper script on a timer and sends you whatever the script prints.
Because the helper prints **only when it becomes available**, you only get messages when it matters.

Check every 10 minutes:
- `*/10 * * * *`

If you want me to wire this into Clawdbot Gateway cron (so you get Telegram pings), tell me:
- target (`home`)
- interval (every 5/10/20 min)
- quiet hours (optional)
