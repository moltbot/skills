---
name: meeting-prep
description: "Automated meeting preparation and daily commit summaries. Use when checking Google Calendar for upcoming meetings, generating standup updates from GitHub commits, or sending daily development summaries. Pulls meeting schedules and commit history, then formats verbose developer-friendly updates."
---

# Meeting Prep

Automated meeting preparation and daily commit summaries for development teams.

## Capabilities

1. **Meeting Prep** — Check Google Calendar for upcoming meetings with video links, notify user, generate commit-based updates
2. **Daily Summary** — End-of-day summary of all commits across all developers

## Setup Requirements

### Google Calendar OAuth

Create OAuth credentials in Google Cloud Console:

1. Enable Google Calendar API
2. Create OAuth 2.0 Desktop credentials
3. Store `client_secret.json` in `credentials/`
4. Authorize with scopes: `https://www.googleapis.com/auth/calendar`
5. Store tokens in `credentials/calendar_tokens.json`

For multiple accounts, store separate token files per account.

### GitHub Token

Create a classic Personal Access Token with `repo` scope. Store at `credentials/github_token`.

## Workflows

### Meeting Prep Check

Trigger: Cron every 15 minutes or heartbeat.

1. Query configured calendars for events in next 45 minutes
2. Filter for events with Google Meet links (`hangoutLink` or `conferenceData`)
3. If meeting 30-45 min away and not yet notified:
   - Ask user: "Meeting [title] in X min. When was your last update? Which repos should I check?"
   - Track in state file to avoid duplicates
4. If meeting 10-20 min away:
   - Generate update from commits
   - Send formatted update

### Daily Commit Summary

Trigger: Cron at end of day.

1. Fetch all commits from configured repos for current day
2. Include all developers
3. Group by repo and subdirectory
4. Format with author names
5. Send summary

## API Reference

### Check Calendar

```bash
NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
LATER=$(date -u -d "+45 minutes" +%Y-%m-%dT%H:%M:%SZ)
TOKEN=$(jq -r '.access_token' credentials/calendar_tokens.json)

curl -s "https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=$NOW&timeMax=$LATER&singleEvents=true" \
  -H "Authorization: Bearer $TOKEN" | \
  jq '[.items[] | select(.hangoutLink != null or .conferenceData != null)]'

Refresh Token

CLIENT_ID=$(jq -r '.installed.client_id' credentials/client_secret.json)
CLIENT_SECRET=$(jq -r '.installed.client_secret' credentials/client_secret.json)
REFRESH_TOKEN=$(jq -r '.refresh_token' credentials/calendar_tokens.json)

curl -s -X POST https://oauth2.googleapis.com/token \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET" \
  -d "refresh_token=$REFRESH_TOKEN" \
  -d "grant_type=refresh_token"

Fetch Commits

TOKEN=$(cat credentials/github_token)
SINCE=$(date -u -d "-7 days" +%Y-%m-%dT%H:%M:%SZ)

# List org repos
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.github.com/orgs/ORG_NAME/repos?per_page=50&sort=pushed"

# Get commits
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.github.com/repos/ORG/REPO/commits?since=$SINCE&per_page=30"

Output Format

Plain text, no markdown, no emojis:

Update - [DATE]

[repo-name]

[subdirectory]
• Verbose description of change (Author)
• Another change (Author)

Today
• [user input]

Blockers
• None

Discussion
• None

Formatting Rules

• Group by repo, then subdirectory
• Summarize commits into meaningful descriptions
• Include author names
• Plain text only for easy copy-paste
State Management

Track state in data/meeting-prep-state.json:

{
  "notified": {},
  "config": {
    "repoFilter": "org-name/*"
  }
}
```
