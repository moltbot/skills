---
name: fathom
description: Connect to Fathom AI to fetch call recordings, transcripts, and summaries. Use when user asks about their meetings, call history, or wants to search past conversations.
read_when:
  - User asks about their Fathom calls or meetings
  - User wants to search call transcripts
  - User needs a call summary or action items
  - User wants to set up Fathom integration
metadata:
  clawdbot:
    emoji: "📞"
    requires:
      bins: ["curl", "jq"]
---

# Fathom Skill

Connect to [Fathom AI](https://fathom.video) to fetch call recordings, transcripts, and summaries.

## Setup

### 1. Get Your API Key
1. Go to [developers.fathom.ai](https://developers.fathom.ai)
2. Create an API key
3. Copy the key (format: `v1XDx...`)

### 2. Configure
```bash
# Option A: Store in file (recommended)
echo "YOUR_API_KEY" > ~/.fathom_api_key
chmod 600 ~/.fathom_api_key

# Option B: Environment variable
export FATHOM_API_KEY="YOUR_API_KEY"
```

### 3. Test Connection
```bash
./scripts/setup.sh
```

---

## Commands

### List Recent Calls
```bash
./scripts/list-calls.sh                    # Last 10 calls
./scripts/list-calls.sh --limit 20         # Last 20 calls
./scripts/list-calls.sh --after 2026-01-01 # Calls after date
./scripts/list-calls.sh --json             # Raw JSON output
```

### Get Transcript
```bash
./scripts/get-transcript.sh 123456789      # By recording ID
./scripts/get-transcript.sh 123456789 --json
./scripts/get-transcript.sh 123456789 --text-only
```

### Get Summary
```bash
./scripts/get-summary.sh 123456789         # By recording ID
./scripts/get-summary.sh 123456789 --json
```

### Search Calls
```bash
./scripts/search-calls.sh "product launch" # Search transcripts
./scripts/search-calls.sh --speaker "Lucas"
./scripts/search-calls.sh --after 2026-01-01 --before 2026-01-15
```

---

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/meetings` | GET | List meetings with filters |
| `/recordings/{id}/transcript` | GET | Full transcript with speakers |
| `/recordings/{id}/summary` | GET | AI summary + action items |
| `/webhooks` | POST | Register webhook for auto-sync |

**Base URL:** `https://api.fathom.ai/external/v1`  
**Auth:** `X-API-Key` header

---

## Filters for list-calls

| Filter | Description | Example |
|--------|-------------|---------|
| `--limit N` | Number of results | `--limit 20` |
| `--after DATE` | Calls after date | `--after 2026-01-01` |
| `--before DATE` | Calls before date | `--before 2026-01-15` |
| `--cursor TOKEN` | Pagination cursor | `--cursor eyJo...` |

---

## Output Formats

| Flag | Description |
|------|-------------|
| `--json` | Raw JSON from API |
| `--table` | Formatted table (default for lists) |
| `--text-only` | Plain text (transcripts only) |

---

## Examples

### Get your last call's summary
```bash
# Get latest call ID
CALL_ID=$(./scripts/list-calls.sh --limit 1 --json | jq -r '.[0].recording_id')

# Get summary
./scripts/get-summary.sh $CALL_ID
```

### Export all calls from last week
```bash
./scripts/list-calls.sh --after $(date -d '7 days ago' +%Y-%m-%d) --json > last_week_calls.json
```

### Find calls mentioning a topic
```bash
./scripts/search-calls.sh "quarterly review"
```

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| "No API key found" | Run setup or set `FATHOM_API_KEY` |
| "401 Unauthorized" | Check API key is valid |
| "429 Rate Limited" | Wait and retry |
| "Recording not found" | Verify recording ID exists |

---

## Webhook Setup (Advanced)

For automatic transcript ingestion, see the webhook setup guide:
```bash
./scripts/setup-webhook.sh --url https://your-endpoint.com/webhook
```

Requires a publicly accessible HTTPS endpoint.
