---
name: plaud-api
description: Use when accessing Plaud voice recorder data (recordings, transcripts, AI summaries) - guides credential setup and provides patterns for plaud_client.py
aliases:
  - plaud
  - plaud-recordings
---

# Plaud API Skill

Access Plaud voice recorder data including recordings, transcripts, and AI-generated summaries.

## Overview

The Plaud API provides access to:
- **Audio files**: MP3 recordings from your Plaud device
- **Transcripts**: Full text transcriptions with speaker diarization
- **AI summaries**: Auto-generated notes and summaries

**Core principle**: Use `plaud_client.py` (included in this skill), not raw API calls. The client handles authentication, error handling, and response parsing.

## When to Use This Skill

Use this skill when:
- User mentions "Plaud", "Plaud recording", or "transcript from Plaud"
- Need to access voice recorder data
- Working with recordings, transcripts, or AI notes from a Plaud device

## Interactive Credential Tutorial

Before using the Plaud API, you need to extract credentials from the web app.

### Step 1: Navigate to Plaud Web App

Open Chrome and go to: https://web.plaud.ai

Log in with your Plaud account if not already logged in.

### Step 2: Open Chrome DevTools

Press `F12` (or `Cmd+Option+I` on Mac) to open DevTools.

### Step 3: Find localStorage Values

1. Click the **Application** tab in DevTools
2. In the left sidebar, expand **Local Storage**
3. Click on `https://web.plaud.ai`

### Step 4: Copy Required Values

Find and copy these two values:

| Key | Description |
|-----|-------------|
| `tokenstr` | Your bearer token (starts with "bearer eyJ...") |
| `plaud_user_api_domain` | API endpoint (e.g., "https://api-euc1.plaud.ai") |

### Step 5: Create .env File

Create or update the `.env` file in the skill directory (`~/.claude/skills/plaud-api/`):

```bash
# In the skill directory
cd ~/.claude/skills/plaud-api
cp .env.example .env
# Edit .env with your actual credentials
```

Or create it directly:

```bash
cat > ~/.claude/skills/plaud-api/.env << 'EOF'
PLAUD_TOKEN=bearer eyJ...your_full_token_here...
PLAUD_API_DOMAIN=https://api-euc1.plaud.ai
EOF
```

**Important**: Include the full token including the "bearer " prefix.

### Step 6: Verify Setup

Test that credentials work:

```bash
cd ~/.claude/skills/plaud-api
python3 plaud_client.py list
```

If successful, you'll see a list of your recordings with file IDs, durations, and names.

**First-time setup**: Install dependencies if needed:
```bash
pip install -r ~/.claude/skills/plaud-api/requirements.txt
```

## .env File Format

```
PLAUD_TOKEN=bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PLAUD_API_DOMAIN=https://api-euc1.plaud.ai
```

**Notes**:
- The token includes the "bearer " prefix
- API domain is region-specific (EU users: `api-euc1`, US users may differ)

## Quick Reference

All commands should be run from the skill directory (`~/.claude/skills/plaud-api`):

| Task | Command |
|------|---------|
| List all recordings | `python3 plaud_client.py list` |
| List as JSON | `python3 plaud_client.py list --json` |
| Get file details | `python3 plaud_client.py details <file_id>` |
| Get details as JSON | `python3 plaud_client.py details <file_id> --json` |
| Download audio | `python3 plaud_client.py download <file_id>` |
| Download to path | `python3 plaud_client.py download <file_id> -o output.mp3` |
| Download all files | `python3 plaud_client.py download-all -o ./recordings` |
| Get file tags/folders | `python3 plaud_client.py tags` |

## Common Patterns

### Fetch Recent Transcripts

```bash
cd ~/.claude/skills/plaud-api

# List files to find IDs
python3 plaud_client.py list

# Get transcript for a specific file
python3 plaud_client.py details <file_id> --json | jq '.data.trans_result'
```

### File ID Discovery

File IDs are 32-character hex strings. Find them from:
1. **URLs**: `https://web.plaud.ai/file/{file_id}`
2. **List output**: First column in `python3 plaud_client.py list`
3. **JSON output**: `python3 plaud_client.py list --json | jq '.[].id'`

### Get AI Summary

```bash
python3 plaud_client.py details <file_id> --json | jq '.data.ai_content'
```

### Batch Operations

```bash
# Download all recordings to a folder
python3 plaud_client.py download-all -o ./all_recordings

# Get all file IDs
python3 plaud_client.py list --json | jq -r '.[].id'
```

### Extract Transcript Text Only

```bash
# Get plain transcript text (all segments concatenated)
python3 plaud_client.py details <file_id> --json | jq -r '.data.trans_result.segments[].text' | tr '\n' ' '
```

## Error Handling

| Error | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` | Token expired or invalid | Re-extract token from localStorage |
| `Empty response` | Invalid file_id format | Verify file_id is 32 hex characters |
| `Connection error` | Wrong API domain | Check PLAUD_API_DOMAIN in .env |
| `Token required` | Missing .env or PLAUD_TOKEN | Follow credential tutorial above |

## Token Refresh

Plaud tokens are long-lived (~10 months), but when they expire:

1. Log into https://web.plaud.ai
2. Open DevTools > Application > Local Storage
3. Copy the new `tokenstr` value
4. Update your `.env` file

## API Reference

For detailed API documentation, see `PLAUD_API.md` included in this skill directory.

Key endpoints used by plaud_client.py:
- `GET /file/simple/web` - List all files
- `GET /file/detail/{file_id}` - Get file details with transcript
- `GET /file/download/{file_id}` - Download MP3 audio
- `GET /filetag/` - Get file tags/folders

## Included Files

| File | Purpose |
|------|---------|
| `plaud_client.py` | CLI tool for all Plaud API operations |
| `PLAUD_API.md` | Detailed API endpoint documentation |
| `requirements.txt` | Python dependencies |
| `.env.example` | Template for credentials |
