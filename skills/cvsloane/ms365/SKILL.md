# Microsoft 365 Integration

## Description
Access Microsoft 365 services - Email (Outlook), Calendar, OneDrive, To Do tasks, and Contacts via MS Graph API.

## Activation
Activated when user mentions: outlook, email, calendar, onedrive, microsoft, office 365, o365, ms365, my meetings, my emails, schedule meeting, send email, check calendar, to do, microsoft tasks

## Configuration
Authentication is cached after first login. No environment variables required for device code flow.

For headless/automated operation, set these environment variables:
- MS365_MCP_CLIENT_ID - Azure AD app client ID
- MS365_MCP_CLIENT_SECRET - Azure AD app secret
- MS365_MCP_TENANT_ID - Tenant ID (use "consumers" for personal accounts)

## Available Commands

### Authentication

```bash
# Login via device code (interactive)
python3 /root/clawd/skills/ms365/ms365_cli.py login

# Check authentication status
python3 /root/clawd/skills/ms365/ms365_cli.py status

# List cached accounts
python3 /root/clawd/skills/ms365/ms365_cli.py accounts

# Get current user info
python3 /root/clawd/skills/ms365/ms365_cli.py user
```

### Email (Outlook)

```bash
# List recent emails
python3 /root/clawd/skills/ms365/ms365_cli.py mail list [--top N]

# Read specific email
python3 /root/clawd/skills/ms365/ms365_cli.py mail read MESSAGE_ID

# Send email
python3 /root/clawd/skills/ms365/ms365_cli.py mail send --to "recipient@example.com" --subject "Subject" --body "Message body"
```

### Calendar

```bash
# List upcoming events
python3 /root/clawd/skills/ms365/ms365_cli.py calendar list [--top N]

# Create event
python3 /root/clawd/skills/ms365/ms365_cli.py calendar create --subject "Meeting" --start "2026-01-15T10:00:00" --end "2026-01-15T11:00:00" [--body "Description"] [--timezone "America/Chicago"]
```

### OneDrive Files

```bash
# List files in root
python3 /root/clawd/skills/ms365/ms365_cli.py files list

# List files in folder
python3 /root/clawd/skills/ms365/ms365_cli.py files list --path "Documents"
```

### To Do Tasks

```bash
# List task lists
python3 /root/clawd/skills/ms365/ms365_cli.py tasks lists

# Get tasks from a list
python3 /root/clawd/skills/ms365/ms365_cli.py tasks get LIST_ID

# Create task
python3 /root/clawd/skills/ms365/ms365_cli.py tasks create LIST_ID --title "Task title" [--due "2026-01-20"]
```

### Contacts

```bash
# List contacts
python3 /root/clawd/skills/ms365/ms365_cli.py contacts list [--top N]

# Search contacts
python3 /root/clawd/skills/ms365/ms365_cli.py contacts search "John"
```

## Usage Examples

User: "Check my outlook email"
Agent: Runs `mail list --top 10` command

User: "What meetings do I have today?"
Agent: Runs `calendar list` command

User: "Send an email to john@company.com about the project update"
Agent: Runs `mail send` with appropriate parameters

User: "Show my OneDrive files"
Agent: Runs `files list` command

User: "Add a task to review the budget"
Agent: Lists task lists first, then creates task in appropriate list

## Prompts

When helping with Microsoft 365:
- Use the ms365_cli.py script for all operations
- Check authentication status first if commands fail
- If not logged in, guide user through device code login
- For calendar events, use ISO 8601 datetime format
- Default timezone is America/Chicago
- When sending email, confirm recipient and content before sending
- For tasks, list available task lists first so user can choose

## Attribution

This skill uses the **ms-365-mcp-server** by Softeria.
- **NPM Package**: [@softeria/ms-365-mcp-server](https://www.npmjs.com/package/@softeria/ms-365-mcp-server)
- **GitHub**: https://github.com/Softeria/ms-365-mcp-server
- **License**: MIT
