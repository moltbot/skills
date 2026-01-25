---
name: supabase
description: Query Supabase projects - count users, list signups, check stats. Use for database queries and user analytics.
triggers:
  - supabase
  - database
  - how many users
  - new signups
  - user count
metadata:
  clawdbot:
    emoji: "⚡"
---

# Supabase ⚡

Query your Supabase projects directly from chat.

## Setup

### 1. Get your credentials

Go to **Supabase Dashboard → Project Settings → API**

You'll see two tabs:
- **"Publishable and secret API keys"** - New format (limited functionality)
- **"Legacy anon, service_role API keys"** - JWT format (full functionality)

**⚠️ Use the Legacy JWT key for full access!**

The `service_role` JWT key (starts with `eyJ...`) gives full admin access including:
- Listing users with details
- Counting signups
- Accessing auth.users

The new `sb_secret_...` keys have limited functionality and can't access the Admin API.

### 2. Find your keys

1. Go to: **Project Settings → API**
2. Click the **"Legacy anon, service_role API keys"** tab
3. Find `service_role` (marked with red "secret" badge)
4. Click **Reveal** and copy the `eyJ...` token

Direct link: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF/settings/api`

### 3. Configure

**Option A: Interactive setup**
```bash
python3 {baseDir}/scripts/supabase.py auth
```

**Option B: Manual config**
Create `~/.supabase_config.json`:
```json
{
  "url": "https://xxxxx.supabase.co",
  "service_key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Option C: Environment variables**
```bash
export SUPABASE_URL="https://xxxxx.supabase.co"
export SUPABASE_SERVICE_KEY="eyJhbG..."
```

## Commands

### User Analytics
```bash
# Count total users
python3 {baseDir}/scripts/supabase.py users

# Count new users (24h)
python3 {baseDir}/scripts/supabase.py users-today

# Count new users (7 days)  
python3 {baseDir}/scripts/supabase.py users-week

# List users with details (name, email, provider, signup date)
python3 {baseDir}/scripts/supabase.py list-users

# List new users from last 24h
python3 {baseDir}/scripts/supabase.py list-users-today

# Limit results
python3 {baseDir}/scripts/supabase.py list-users --limit 5
```

### Project Info
```bash
# Show project info and key type
python3 {baseDir}/scripts/supabase.py info

# List tables exposed via REST API
python3 {baseDir}/scripts/supabase.py tables
```

### JSON Output
```bash
python3 {baseDir}/scripts/supabase.py list-users --json
```

## Key Types Explained

| Key Type | Format | User Listing | User Count | REST Tables |
|----------|--------|--------------|------------|-------------|
| JWT service_role | `eyJ...` | ✅ Yes | ✅ Yes | ✅ Yes |
| New secret | `sb_secret_...` | ❌ No | ❌ No | ✅ Yes |

**Recommendation:** Always use the JWT `service_role` key for Clawdbot integration.

## Daily Reports

Set up automated daily user reports via Clawdbot cron.

### Example: Daily 5 PM Report

Ask Clawdbot:
```
Send me a report of how many new users signed up at 5 PM every day, 
show the last 5 signups with their names
```

This creates a cron job like:
```json
{
  "name": "Daily Supabase User Report",
  "schedule": {
    "kind": "cron",
    "expr": "0 17 * * *",
    "tz": "America/Los_Angeles"
  },
  "payload": {
    "message": "Supabase daily report: Count new user signups in the last 24 hours, and list the 5 most recent signups with their name and email."
  }
}
```

### Sample Report Output

```
📊 Supabase Daily Report

New signups (last 24h): 2

Last 5 signups:
• Jane Smith <jane@example.com> (google) - 2026-01-25
• Alex Johnson <alex.j@company.com> (google) - 2026-01-25
• Sam Wilson <sam@startup.io> (email) - 2026-01-24
• Chris Lee <chris.lee@email.com> (google) - 2026-01-23
• Jordan Taylor <jordan@acme.co> (github) - 2026-01-22
```

## Troubleshooting

### "list-users requires a JWT service_role key"
You're using an `sb_secret_...` key. Get the JWT key from:
**Project Settings → API → Legacy tab → service_role → Reveal**

### "No API key found in request"  
The new `sb_secret_` keys don't work with all endpoints. Switch to the JWT key.

### Keys not showing
Make sure you're on the **"Legacy anon, service_role API keys"** tab, not the new API keys tab.

## Security Note

The `service_role` key has **full admin access** to your database. Keep it secure:
- Never commit to git
- Don't expose in client-side code
- Only use on trusted machines

The config file is automatically set to mode 600 (owner read/write only).
