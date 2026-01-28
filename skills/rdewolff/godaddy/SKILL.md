---
name: godaddy
description: GoDaddy API for managing DNS records. Use for listing, adding, updating, or deleting DNS records on GoDaddy-managed domains.
---

# GoDaddy DNS

Manage DNS records for domains hosted on GoDaddy.

## Setup

Get your API credentials from GoDaddy:
1. Go to https://developer.godaddy.com/keys
2. Create a new API Key (Production)
3. Note down the Key and Secret

Store in `~/.clawdbot/clawdbot.json`:
```json
{
  "skills": {
    "entries": {
      "godaddy": {
        "apiKey": "YOUR_API_KEY",
        "apiSecret": "YOUR_API_SECRET"
      }
    }
  }
}
```

Or set env: `GODADDY_API_KEY=xxx` and `GODADDY_API_SECRET=xxx`

## Quick Reference

### List Domains
```bash
{baseDir}/scripts/godaddy.sh domains list
```

### DNS Records
```bash
# List all DNS records for a domain
{baseDir}/scripts/godaddy.sh dns list <domain>

# List records by type
{baseDir}/scripts/godaddy.sh dns list <domain> --type A
{baseDir}/scripts/godaddy.sh dns list <domain> --type CNAME
{baseDir}/scripts/godaddy.sh dns list <domain> --type TXT
{baseDir}/scripts/godaddy.sh dns list <domain> --type MX

# Get specific record
{baseDir}/scripts/godaddy.sh dns get <domain> <type> <name>

# Add a record
{baseDir}/scripts/godaddy.sh dns add <domain> --type A --name www --data 1.2.3.4 --ttl 3600
{baseDir}/scripts/godaddy.sh dns add <domain> --type CNAME --name blog --data example.com --ttl 3600
{baseDir}/scripts/godaddy.sh dns add <domain> --type TXT --name _dmarc --data "v=DMARC1; p=none" --ttl 3600

# Update a record (replaces existing records with same type+name)
{baseDir}/scripts/godaddy.sh dns update <domain> --type A --name www --data 5.6.7.8 --ttl 3600

# Delete records by type and name
{baseDir}/scripts/godaddy.sh dns delete <domain> --type A --name www
```

## Common DNS Record Types

| Type | Usage |
|------|-------|
| A | IPv4 address |
| AAAA | IPv6 address |
| CNAME | Alias to another domain |
| MX | Mail server |
| TXT | Text records (SPF, DKIM, verification) |
| NS | Nameserver |
| SRV | Service records |

## Examples

### Add subdomain pointing to IP
```bash
godaddy.sh dns add example.com --type A --name app --data 192.168.1.1 --ttl 600
```

### Add CNAME for www
```bash
godaddy.sh dns add example.com --type CNAME --name www --data example.com --ttl 3600
```

### Add TXT for domain verification
```bash
godaddy.sh dns add example.com --type TXT --name @ --data "google-site-verification=xxx" --ttl 3600
```

### Add MX record
```bash
godaddy.sh dns add example.com --type MX --name @ --data "mail.example.com" --ttl 3600 --priority 10
```

## Notes

- API Base: `https://api.godaddy.com`
- Auth: `Authorization: sso-key {key}:{secret}`
- The `@` symbol represents the root domain
- TTL is in seconds (minimum 600 for most record types)
- Rate limits apply - don't spam the API
