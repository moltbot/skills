# 💪 Fitbit Skill for Clawdbot

A [Clawdbot](https://github.com/clawdbot/clawdbot) skill that provides CLI access to Fitbit health data. Enables your AI agent to answer questions about your activity, heart rate, and fitness metrics.

## What is Clawdbot?

[Clawdbot](https://github.com/clawdbot/clawdbot) is an AI agent platform that connects Claude to your tools, services, and data. Skills extend Clawdbot's capabilities — this one adds Fitbit integration.

## Features

- 🔐 Secure OAuth 2.0 PKCE authentication
- 📊 Activity summaries (steps, calories, distance, floors)
- 💓 Heart rate and resting HR data
- 🏃 Active minutes breakdown
- 📅 Historical data by date
- 🤖 Natural language queries through Clawdbot

## Installation

### As a Clawdbot Skill

```bash
# Clone to your Clawdbot workspace skills folder
cd ~/clawd/skills
git clone https://github.com/pb3975/clawdbot-fitbit-skill.git fitbit

# Install and build
cd fitbit
npm install
npm run build

# Link globally so Clawdbot can find the CLI
npm link
```

Clawdbot will automatically detect the skill via `SKILL.md`.

### Standalone CLI

```bash
npm install -g clawdbot-fitbit-skill
```

## Setup

1. **Create a Fitbit App**
   - Go to [dev.fitbit.com/apps](https://dev.fitbit.com/apps)
   - Register a new app with:
     - **OAuth 2.0 Application Type:** Personal
     - **Callback URL:** `http://localhost:18787/callback`

2. **Configure**
   ```bash
   fitbit configure
   ```
   Enter your Client ID when prompted.

3. **Authenticate**
   ```bash
   fitbit login
   ```
   Your browser will open for Fitbit authorization.

## Usage

### Through Clawdbot (Natural Language)

Once installed, just ask Clawdbot:

- *"How many steps did I take today?"*
- *"What's my resting heart rate?"*
- *"Show me my activity summary for yesterday"*
- *"How active was I this week?"*

### Direct CLI

```bash
# Today's summary
fitbit today

# Activity details
fitbit activity
fitbit activity 2024-01-15

# Specific metrics
fitbit activity steps
fitbit activity calories

# User profile
fitbit profile

# Auth status
fitbit status

# Sign out
fitbit logout
```

### Options

All commands support:
- `--json` — Output as JSON (useful for scripting)
- `--no-color` — Plain text output
- `--verbose` — Debug info
- `--tz <zone>` — Override timezone

## Security

- Tokens stored in `~/.config/fitbit-cli/tokens.json` with 0600 permissions
- OAuth uses PKCE (no client secret stored)
- Callback server binds to 127.0.0.1 only
- Temp auth files use secure random paths

## Related

- [Clawdbot](https://github.com/clawdbot/clawdbot) - AI agent platform
- [ClawdHub](https://clawdhub.com) - Skill marketplace

## License

MIT
