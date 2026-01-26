# Plaud API Claude Skill

A self-contained Claude Code skill for accessing Plaud voice recorder data (recordings, transcripts, AI summaries).

## Contents

| File | Purpose |
|------|---------|
| `SKILL.md` | Main skill document with credential tutorial |
| `plaud_client.py` | CLI tool for Plaud API access |
| `PLAUD_API.md` | Detailed API documentation |
| `requirements.txt` | Python dependencies |
| `.env.example` | Template for credentials |

## Installation

### Option 1: Symlink (Recommended for Development)

```bash
ln -s /path/to/plaud-api ~/.claude/skills/plaud-api
```

### Option 2: Copy

```bash
cp -r /path/to/plaud-api ~/.claude/skills/
```

## Quick Setup

1. Install Python dependencies:
   ```bash
   pip install -r ~/.claude/skills/plaud-api/requirements.txt
   ```

2. Copy the example environment file:
   ```bash
   cd ~/.claude/skills/plaud-api
   cp .env.example .env
   ```

3. Follow the credential tutorial in `SKILL.md` to obtain your Plaud API token

4. Update `.env` with your actual credentials

5. Test with:
   ```bash
   cd ~/.claude/skills/plaud-api
   python3 plaud_client.py list
   ```

## Usage

In Claude Code, invoke with:
- `/plaud-api` - Full skill with setup tutorial
- `/plaud` - Alias
- `/plaud-recordings` - Alias

## Requirements

- Python 3.x
- `requests` and `python-dotenv` packages (see requirements.txt)
- Plaud account with web access at https://web.plaud.ai
