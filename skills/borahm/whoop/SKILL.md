---
name: whoop
description: WHOOP morning check-in (recovery/sleep/strain) with suggestions.
metadata:
  clawdbot:
    config:
      requiredEnv:
        - WHOOP_CLIENT_ID
        - WHOOP_CLIENT_SECRET
        - WHOOP_REFRESH_TOKEN
---

# whoop

WHOOP morning check-in:
- fetches your latest WHOOP data (Recovery, Sleep, Cycle/Strain)
- generates a short set of suggestions for the day

## Quick Start (User + Bot)

### What the user does (one-time)

1) Create a WHOOP app and get credentials:
- `WHOOP_CLIENT_ID`
- `WHOOP_CLIENT_SECRET`

2) In the WHOOP developer dashboard, set Redirect URL:
- `https://localhost:3000/callback`

3) Put secrets into `~/.clawdbot/.env`:

```bash
WHOOP_CLIENT_ID=...
WHOOP_CLIENT_SECRET=...
```

4) Authorize once (get refresh token):

```bash
node /home/claw/clawd/skills/whoop/bin/whoop-auth --redirect-uri https://localhost:3000/callback
```

- Open the printed URL on your phone/browser
- Tap Allow/Authorize
- Copy the `code` from the callback URL and paste it back

This writes `WHOOP_REFRESH_TOKEN=...` into `~/.clawdbot/.env`.

### What the bot does (each run)

Run:

```bash
node /home/claw/clawd/skills/whoop/bin/whoop-morning
```

Then send the output back to the user.

## Automation (daily)

Recommended: schedule with Gateway cron (daily morning).
- Command: `node /home/claw/clawd/skills/whoop/bin/whoop-morning`
- Bot should send the output as a message.

## Notes

- OAuth endpoints:
  - auth: `https://api.prod.whoop.com/oauth/oauth2/auth`
  - token: `https://api.prod.whoop.com/oauth/oauth2/token`
- Requires `offline` scope to receive refresh tokens.
- WHOOP rotates refresh tokens; the newest refresh token must be saved.
