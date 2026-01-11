---
name: resend
description: Manage received (inbound) emails and attachments via Resend API. Use when user asks about their emails, received messages, or email attachments.
homepage: https://resend.com
metadata:
  clawdbot:
    emoji: "📧"
    requires:
      bins: ["resend"]
      env: ["RESEND_API_KEY"]
---

# Resend CLI

CLI for the Resend email API. Query received (inbound) emails and attachments.

## Installation

```bash
npm install -g @mjrussell/resend-cli
```

## Setup

1. Sign up at [resend.com](https://resend.com)
2. Set up inbound email routing for your domain
3. Create API key at API Keys → Create API key (needs read permissions)
4. Set environment variable: `export RESEND_API_KEY="re_your_key"`

## Commands

### List Emails

```bash
resend email list              # List recent emails (default 10)
resend email list -l 20        # List 20 emails
resend email list --json       # Output as JSON
```

### Get Email Details

```bash
resend email get <id>          # Show email details
resend email get <id> --json   # Output as JSON
```

### Attachments

```bash
resend email attachments <email_id>                    # List attachments
resend email attachment <email_id> <attachment_id>     # Get attachment metadata
resend email attachments <email_id> --json             # Output as JSON
```

### Domains

```bash
resend domain list             # List configured domains
resend domain get <id>         # Get domain details with DNS records
resend domain list --json      # Output as JSON
```

## Usage Examples

**User: "Do I have any new emails?"**
```bash
resend email list -l 5
```

**User: "Show me the latest email"**
```bash
resend email list --json | jq -r '.data.data[0].id'  # Get ID
resend email get <id>
```

**User: "What attachments are on that email?"**
```bash
resend email attachments <email_id>
```

**User: "What domains do I have set up?"**
```bash
resend domain list
```

**User: "Show me the full content of email X"**
```bash
resend email get <email_id>
```

## Notes

- This CLI only supports **received (inbound)** emails, not sending
- Use `--json` flag and pipe to `jq` for scripting
- Email IDs are UUIDs shown in list output
