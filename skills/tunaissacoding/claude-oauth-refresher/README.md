# Claude OAuth Token Refresher

Automatically refreshes your Claude tokens before they expire. No more authentication failures.

## Requirements

- macOS with Keychain
- `jq` (`brew install jq`)
- Clawdbot (for scheduling)

## What It Does

- Checks your Claude token every few hours
- Refreshes it 30 minutes before expiry
- Updates both Keychain and Clawdbot automatically
- Works silently in the background

## Installation

```bash
clawdhub install claude-oauth-refresher
```

### First-Time Setup

**Most users: Just run it**
```bash
cd ~/clawd/skills/claude-oauth-refresher
./refresh-token.sh
```

**Expected output:**
```
✅ Token still valid (475 minutes remaining)
```

**That's it!** The script auto-discovers your keychain setup.

### What Happens

- ✅ Finds your tokens in Keychain (tries common account names)
- ✅ Validates token structure
- ✅ Sets up automatic refresh schedule
- ✅ Logs all operations to `~/clawd/logs/`

## How It Works

1. **Reads** your current token from macOS Keychain
2. **Checks** expiry time (default: refresh 30 min before)
3. **Calls** Anthropic OAuth API with refresh token
4. **Updates** both Keychain and `~/.clawdbot/agents/main/agent/auth-profiles.json`

**Automatic fallback:** If your account name isn't "claude", it tries:
- "Claude Code"
- "default"
- "oauth"
- "anthropic"

**Example (force refresh):**
```bash
./refresh-token.sh --force
```

Output:
```
[17:48:16] ✓ Received new tokens
[17:48:16] New expiry: 2026-01-24 01:48:16 (8 hours)
[17:48:16] ✓ Auth file updated
[17:48:16] ✓ Keychain updated
✅ Token refreshed successfully!
```

---

## 📚 Advanced Information

<details>
<summary><b>Configuration Options</b> (optional customization)</summary>

Create `claude-oauth-refresh-config.json` if you need to customize:

```json
{
  "refresh_buffer_minutes": 30,
  "keychain_service": "Claude Code-credentials",
  "keychain_account": "claude",
  "auth_file": "~/.clawdbot/agents/main/agent/auth-profiles.json"
}
```

**Most users don't need this** - the defaults work fine.

</details>

<details>
<summary><b>Setting Up Another Device</b></summary>

The script has automatic fallback, so usually you just:
1. Copy the skill folder
2. Run `./refresh-token.sh`
3. It finds your tokens automatically

**If your setup is unusual:**

Check which keychain account has your tokens:
```bash
security find-generic-password -l "Claude Code-credentials"
```

Look for the entry with `"acct"<blob>="your-account-name"`

Then create a config file with your account name.

</details>

<details>
<summary><b>How Detection Works</b></summary>

The script:
1. Tries your configured account name first
2. If that fails (or has incomplete data), tries common names
3. Validates each entry has `refreshToken` and `expiresAt`
4. Uses the first complete entry found

**Data structure expected:**
```json
{
  "claudeAiOauth": {
    "accessToken": "sk-ant-oat01-...",
    "refreshToken": "sk-ant-ort01-...",
    "expiresAt": 1769190496000,
    "scopes": [...],
    "subscriptionType": "max",
    "rateLimitTier": "default_claude_max_20x"
  }
}
```

</details>

<details>
<summary><b>Troubleshooting</b></summary>

**"No refreshToken in keychain"**
- Your keychain account name is different
- The script should auto-discover it, but if not:
  ```bash
  security find-generic-password -l "Claude Code-credentials"
  ```
  Check which account has the tokens

**"Failed to retrieve from Keychain"**
- Keychain is locked
- Entry doesn't exist
- Run: `security find-generic-password -s "Claude Code-credentials" -l`

**Token refresh fails**
- Check internet connection
- Verify refresh token hasn't been revoked
- Re-authenticate with Claude if needed

</details>

<details>
<summary><b>For Developers</b></summary>

### Data Flow

```
Keychain (claudeAiOauth JSON)
    ↓ read refreshToken, expiresAt
OAuth API (POST with refresh_token)
    ↓ returns new accessToken, refreshToken, expires_in
Update Keychain (complete JSON)
    ↓
Update auth-profiles.json (just accessToken)
```

### Automatic Scheduling

After refresh, creates a Clawdbot cron job:
```bash
Next refresh = (new_expiry - buffer_minutes)
```

### Portability Features

- Tries multiple common account names
- Validates data structure before using
- Helpful errors with diagnostic commands
- Works without config file (sensible defaults)

</details>

## License

MIT
