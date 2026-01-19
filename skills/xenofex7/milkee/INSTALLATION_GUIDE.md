# MILKEE Skill - Installation Guide

---

## Prerequisites

- Python 3.8+
- MILKEE account with API access
- Clawdbot installed

---

## Step 1: Get Your Credentials

### API Token

1. Log in to MILKEE (https://app.milkee.ch)
2. Go to Settings → API Settings
3. Copy your **User ID** and **API Key**
4. Combine as: `USER_ID|API_KEY`

**Example**: `28014|MqF8I04nbuFd4aT4A5Y6hBqaDDd9T2sjVT5Xu2ZAc799c9d2`

### Company ID

1. In MILKEE, check the URL: `https://app.milkee.ch/companies/XXXX/`
2. XXXX is your **Company ID**

**Example**: `4086`

---

## Step 2: Choose Installation Method

### Method A: Upload to Skill Hub (Recommended)

1. Extract `milkee.skill` from this package
2. Go to your Skill Hub (https://hub.clawdbot.com or your instance)
3. Click "Upload New Skill"
4. Select `milkee.skill`
5. Fill in metadata:
   - Name: `milkee`
   - Category: `Accounting / Time Tracking`
   - Tags: `time-tracking, accounting, projects, swiss`
   - Description: See README.md
6. Review and publish
7. Install via Clawdbot: `clawdbot skill install milkee`

### Method B: Manual Installation

1. Extract the ZIP package
2. Unzip `milkee.skill` to `~/.clawdbot/skills/milkee/`
3. Configure Clawdbot (see Step 3 below)

---

## Step 3: Configure Clawdbot

Edit `~/.clawdbot/clawdbot.json` and add:

```json
{
  "skills": {
    "milkee": {
      "env": {
        "MILKEE_API_TOKEN": "USER_ID|API_KEY",
        "MILKEE_COMPANY_ID": "YOUR_COMPANY_ID"
      }
    }
  }
}
```

**Replace**:
- `USER_ID|API_KEY` with your actual credentials
- `YOUR_COMPANY_ID` with your actual company ID

**Example**:
```json
{
  "skills": {
    "milkee": {
      "env": {
        "MILKEE_API_TOKEN": "28014|MqF8I04nbuFd4aT4A5Y6hBqaDDd9T2sjVT5Xu2ZAc799c9d2",
        "MILKEE_COMPANY_ID": "4086"
      }
    }
  }
}
```

---

## Step 4: Test Installation

Run this command to verify everything works:

```bash
export MILKEE_API_TOKEN="USER_ID|API_KEY"
export MILKEE_COMPANY_ID="YOUR_COMPANY_ID"

python3 ~/.clawdbot/skills/milkee/scripts/milkee.py list_projects
```

**Expected output**:
```
📋 X Projects:

  • Project Name (ID: 123)
  • Another Project (ID: 456)
```

---

## Step 5: Start Using

### Basic Commands

**Start a timer**:
```bash
python3 scripts/milkee.py start_timer "ProjectName" "What you're working on"
```

**Stop the timer**:
```bash
python3 scripts/milkee.py stop_timer
```

**View today's times**:
```bash
python3 scripts/milkee.py list_times_today
```

**List all projects**:
```bash
python3 scripts/milkee.py list_projects
```

---

## Troubleshooting

### "HTTP 401: Unauthorized"
- Check API token format: `USER_ID|API_KEY` (with pipe)
- Verify credentials in MILKEE Settings
- Token might be expired, regenerate in MILKEE

### "HTTP 403: Forbidden"
- Wrong Company ID
- Check URL: `https://app.milkee.ch/companies/XXXX/`
- Use correct XXXX value

### "HTTP 404: Not Found"
- Project/customer ID doesn't exist
- Try listing: `python3 scripts/milkee.py list_projects`

### "Command not found: milkee.py"
- Make sure path is correct
- Try full path: `python3 ~/.clawdbot/skills/milkee/scripts/milkee.py`

---

## Security Notes

⚠️ **Important**:
- Never commit API tokens to git
- Use `.gitignore` to protect config files
- Rotate keys regularly
- Use environment variables, not hardcoded credentials

---

## Next Steps

1. ✅ Installation complete
2. 📖 Read SKILL.md (inside milkee.skill) for full documentation
3. ⏱️ Start tracking time!
4. 📚 Check references/ folder for API details

---

## Support

For issues:
1. Check this guide
2. Review SKILL.md in milkee.skill
3. Check official MILKEE docs: https://apidocs.milkee.ch/api

---

**Happy time tracking!** ⏱️🦭
