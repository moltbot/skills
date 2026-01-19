# MILKEE Configuration Guide

**Official MILKEE Docs**: https://apidocs.milkee.ch/api/authentifizierung.html

## Environment Variables

The skill requires these environment variables:

### MILKEE_API_TOKEN (required)
**Format**: `USER_ID|API_KEY`

Get from MILKEE Settings → API:
1. Log in to MILKEE
2. Settings → API Settings
3. Copy your User ID and API Key
4. Combine as: `USER_ID|API_KEY`

**Example**:
```
28014|MqF8I04nbuFd4aT5Xu2ZAc799c9d2
```

### MILKEE_COMPANY_ID (required)
**Format**: String (numeric ID)

Get from MILKEE URL or Settings:
1. Log in to MILKEE
2. URL will show: `https://app.milkee.ch/companies/XXXX/...`
3. XXXX is your Company ID

**Example**:
```
4086
```

---

## Clawdbot Configuration

Add to `~/.clawdbot/clawdbot.json`:

```json
{
  "skills": {
    "milkee": {
      "env": {
        "MILKEE_API_TOKEN": "USER_ID|API_KEY",
        "MILKEE_COMPANY_ID": "4226"
      }
    }
  }
}
```

---

## Verification

Test configuration:

```bash
export MILKEE_API_TOKEN="28014|MqF8I04nbuFd4aT4A5Y6hBqaDDd9T2sjVT5Xu2ZAc799c9d2"
export MILKEE_COMPANY_ID="4186"

python3 scripts/milkee.py list_projects
```

Expected output:
```
📋 X Projects:

  • Project Name (ID: 123)
  • ...
```

---

## Troubleshooting

### "No credentials configured"
- Check MILKEE_API_TOKEN and MILKEE_COMPANY_ID are set
- Verify format: `USER_ID|API_KEY` (with pipe separator)

### "HTTP 401: Unauthorized"
- Check API token format
- Verify credentials in MILKEE Settings

### "HTTP 403: Forbidden"
- Wrong COMPANY_ID
- Check URL: `https://app.milkee.ch/companies/XXXX/`
- Use correct XXXX value

### "HTTP 404: Not found"
- Resource ID doesn't exist
- Check project_id, customer_id, task_id

---

## Security Notes

- **Never commit credentials** to git
- Use environment variables or config files
- Rotate API keys regularly
- Use least-privilege approach (only needed permissions)
- Keep API tokens confidential

---

## Getting Help

1. Check [api-endpoints.md](api-endpoints.md) for endpoint reference
2. Review error messages in output
3. Verify credentials in MILKEE Settings
4. Check network connectivity to `app.milkee.ch`
