---
name: codex-account-switcher
description: Manage multiple OpenAI Codex accounts. Capture current login tokens and switch between them instantly.
metadata:
  clawdbot:
    emoji: "🎭"
    requires:
      bins: ["python3"]
---

# Codex Account Switcher

Manage multiple OpenAI Codex identities (e.g. personal vs. work) by swapping the authentication token file.

## Usage

### 1. List Accounts
Show saved accounts (active one is marked with `ACTIVE` on the right). Default output is compact.

- `--verbose` includes refresh age + token TTL (debug)
- `--json` outputs the verbose info as JSON
```bash
./codex-accounts.py list
```

To include emails/diagnostics:
```bash
./codex-accounts.py list --verbose
```

### 2. Add an Account
Interactive wizard to capture login(s).

- **Always starts a fresh browser login** (`codex logout && codex login`) so you explicitly choose the identity to capture.
- After each login it saves a snapshot.
- In an interactive terminal it asks if you want to add another.
- When invoked non-interactively (e.g. via Clawdbot), it runs **single-shot** (no "add another" prompt).
- When naming an account, **press Enter** to accept the default name (local-part of the detected email, e.g. `oliver` from `oliver@…`).

```bash
./codex-accounts.py add
```

### 3. Switch Account
Instantly swap the active login.
```bash
./codex-accounts.py use work
```

### 4. Auto-Switch to Best Quota
Check all accounts and switch to the one with most weekly quota available.
```bash
./codex-accounts.py auto
./codex-accounts.py auto --json
```

Output:
```
🔄 Checking quota for 2 account(s)...

  → sylvia... weekly 27% used
  → oliver... weekly 100% used

✅ Switched to: sylvia
   Weekly quota: 27% used (73% available)

All accounts:
   sylvia: 27% weekly ←
   oliver: 100% weekly
```

## How It Works

- Stores `auth.json` files in `~/.codex/accounts/<name>.json`.
- Identifies accounts by decoding the JWT `id_token` to find the email address.
- "Switching" simply overwrites `~/.codex/auth.json` with the saved copy.

## Installation

Add the script to your path for easy access:
```bash
ln -s $(pwd)/codex-accounts.py ~/bin/codex-accounts
```
