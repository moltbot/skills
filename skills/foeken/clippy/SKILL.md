---
name: clippy
description: Microsoft 365 / Outlook CLI for calendar and email. Use when managing Outlook calendar (view, create, update, delete events, find meeting times, respond to invitations), sending/reading emails, or searching for people/rooms in the organization.
---

# Clippy - Microsoft 365 CLI

CLI: `~/bin/clippy`
Repo: `~/projects/clippy`
Source: https://github.com/foeken/clippy

**Note:** Works through the M365 web UI via browser automation (Playwright), not the Graph API. No Azure AD app registration required - just login with your browser.

## Authentication

```bash
# Check auth status
clippy whoami

# Interactive login (opens browser)
clippy login --interactive

# Refresh token (runs automatically via launchd)
clippy refresh
```

## Calendar

```bash
# Today's events
clippy calendar

# Specific day
clippy calendar --day tomorrow
clippy calendar --day monday
clippy calendar --day 2024-02-15

# Week view
clippy calendar --week

# With details (description, attendees)
clippy calendar --details
```

### Create Events

```bash
clippy create-event "Title" 09:00 10:00

# Full options
clippy create-event "Meeting" 14:00 15:00 \
  --day tomorrow \
  --description "Meeting notes" \
  --attendees "alice@company.com,bob@company.com" \
  --teams \
  --find-room

# Recurring
clippy create-event "Standup" 09:00 09:15 --repeat daily
clippy create-event "Sync" 14:00 15:00 --repeat weekly --days mon,wed,fri
```

### Update/Delete Events

```bash
# List events to get index
clippy update-event
clippy update-event 1 --title "New Title"
clippy update-event 1 --start 10:00 --end 11:00
clippy update-event 1 --add-attendee "new@company.com"

# Delete (cancels + notifies attendees)
clippy delete-event 1
clippy delete-event 1 --message "Need to reschedule"
```

### Respond to Invitations

```bash
clippy respond                           # List pending
clippy respond 1 --accept
clippy respond 1 --decline --message "Conflict"
clippy respond 1 --tentative
```

### Find Meeting Times

```bash
clippy findtime
clippy findtime --attendees "alice@company.com,bob@company.com"
clippy findtime --duration 60 --days 5
```

## Email

**Drafts accept both real newlines and literal `\n` in CLI args.**

```bash
# Inbox
clippy mail
clippy mail --unread
clippy mail -n 20                        # 20 emails
clippy mail --search "invoice"

# Other folders
clippy mail sent
clippy mail drafts
clippy mail archive

# Read email
clippy mail -r 1

# Download attachments
clippy mail -d 1 -o ~/Downloads
```

### Send Email

```bash
clippy send \
  --to "recipient@example.com" \
  --subject "Subject" \
  --body "Message body"

# With CC, attachments, markdown
clippy send \
  --to "alice@example.com" \
  --cc "manager@example.com" \
  --subject "Report" \
  --body "**See attached**" \
  --markdown \
  --attach "report.pdf"
```

### Reply/Forward

```bash
clippy mail --reply 1 --message "Thanks!"
clippy mail --reply-all 1 --message "Got it"
clippy mail --forward 1 --to-addr "colleague@example.com"
```

### Email Actions

```bash
clippy mail --mark-read 1
clippy mail --flag 1
clippy mail --move 1 --to archive
```

## People/Room Search

```bash
clippy find "john"                       # People
clippy find "conference" --rooms         # Rooms
```

## JSON Output

Add `--json` to any command for scripting:

```bash
clippy calendar --json
clippy mail --json
```
