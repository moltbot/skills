---
name: typefully
description: |
  X, LinkedIn, Mastodon, Threads, and Bluesky scheduling via Typefully API.

  Create drafts, schedule posts, and manage content across multiple social platforms.
metadata: 
  {"clawdbot":{"emoji":"🐦","requires":{"env":["TYPEFULLY_API_KEY"]}}}
---

# Typefully Skill
Schedule and publish content to X, LinkedIn, Mastodon, Threads, and Bluesky through the Typefully API.

## Setup
- Create a Typefully account at https://typefully.com
- Connect social media accounts in Typefully
- Generate an API key in Typefully settings
- Set the environment variable

```bash
export TYPEFULLY_API_KEY="your-typefully-api-key"
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| TYPEFULLY_API_KEY | Yes | Your Typefully API key |

## Commands

### User and Accounts

```bash
typefully me                    # Get current user info
typefully social-sets           # List connected social accounts
typefully social-set <id>       # Get details for a specific account
```

### Drafts

```bash
typefully drafts                     # List all drafts for an account
typefully draft <id>                 # Get a specific draft
typefully create-draft "content"     # Create a new draft
typefully update-draft <id> "text"   # Update a draft
typefully delete-draft <id>          # Delete a draft
```

### Draft Options

| Option | Description |
|--------|-------------|
| --social-set-id <id> | Account ID required for drafts |
| --schedule <time> | ISO 8601 datetime |
| --now | Publish immediately after creating |
| --next-free-slot | Schedule for optimal posting time |
| --title <text> | Internal draft title |
| --share | Generate public share URL |
| --thread | Treat content as multi-line thread |
| --reply-to <url> | Reply to an existing post URL |
| --community <id> | Post to a community |

### Filtering Drafts

```bash
typefully drafts                  # Default 10 drafts sorted by updated
typefully drafts --status draft   # Only draft status
typefully drafts --status scheduled  # Only scheduled
typefully drafts --status published  # Only published
typefully drafts --limit 25       # More results per page
typefully drafts --offset 10      # Skip first 10 results
typefully drafts --order-by created_at  # Sort by date
```

### Tags

```bash
typefully tags                  # List tags for an account
typefully create-tag "name"     # Create a new tag
typefully delete-tag "slug"     # Delete a tag
```

### Media

```bash
typefully upload-media <filename>    # Get upload URL for media
typefully media-status <id>          # Check media processing status
```

## Examples

### Create a Simple Post

```bash
# Get your account ID
typefully social-sets

# Create a draft
typefully create-draft "Hello world! This is my first post." \
  --social-set-id 12345

# Create and publish immediately
typefully create-draft "Breaking news!" \
  --social-set-id 12345 --now
```

### Create a Thread

```bash
typefully create-draft "1/ I am excited to share some updates...
2/ We have been working hard on new features...
3/ Here is what we have been building...
4/ Stay tuned for more!" \
  --social-set-id 12345 --thread
```

### Schedule for Later

```bash
# Schedule for specific time
typefully create-draft "Mark your calendars! Launching next week." \
  --social-set-id 12345 \
  --schedule "2025-01-25T09:00:00Z"

# Schedule for optimal posting time
typefully create-draft "Best time to post..." \
  --social-set-id 12345 \
  --next-free-slot
```

### Reply to a Post

```bash
typefully create-draft "Great thread! I completely agree." \
  --social-set-id 12345 \
  --reply-to "https://x.com/username/status/1234567890"
```

### Post to a Community

```bash
typefully create-draft "Sharing with the community..." \
  --social-set-id 12345 \
  --community 1493446837214187523
```

### Work with Tags

```bash
# List available tags
typefully tags --social-set-id 12345

# Create a tag
typefully create-tag "announcements" --social-set-id 12345

# Create draft with tag
typefully create-draft "Big announcement!" \
  --social-set-id 12345 \
  --tags announcements
```

### Upload Media

```bash
# Get upload URL
typefully upload-media screenshot.png --social-set-id 12345

# Check status
typefully media-status <media-id> --social-set-id 12345
```

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /v2/me | Get current user |
| GET | /v2/social-sets | List social sets |
| GET | /v2/social-sets/{id} | Get social set details |
| GET | /v2/social-sets/{id}/drafts | List drafts |
| POST | /v2/social-sets/{id}/drafts | Create draft |
| GET | /v2/social-sets/{id}/drafts/{id} | Get draft |
| PATCH | /v2/social-sets/{id}/drafts/{id} | Update draft |
| DELETE | /v2/social-sets/{id}/drafts/{id} | Delete draft |
| GET | /v2/social-sets/{id}/tags | List tags |
| POST | /v2/social-sets/{id}/tags | Create tag |
| DELETE | /v2/social-sets/{id}/tags/{slug} | Delete tag |
| POST | /v2/social-sets/{id}/media/upload | Get upload URL |
| GET | /v2/social-sets/{id}/media/{id} | Check media status |

## Supported Platforms
- X
- LinkedIn
- Mastodon
- Threads
- Bluesky

## X Automation Compliance
Adhere to the X Automation Rules when using this skill with X:
- Do not post similar content across multiple accounts.
- Do not use automation to manipulate trending topics.
- Send automated replies only to users who have opted in.
- Send only one automated response per user interaction.
- Automated likes and bulk following are prohibited.
- Automated bulk adding to lists is prohibited.
- Follow the X media policy for all automated content.
- Mark accounts as sensitive if posting graphic media.
- Do not use automation to impersonate others.
- Do not post misleading links.

## Notes
- All requests require the TYPEFULLY_API_KEY environment variable.
- Drafts are private by default.
- Use --share for a public URL.
- The --now flag publishes immediately without saving a draft.
- Drafts are saved for review when you do not use --now.
- Rate limits apply per user and per social set.
- Do not attempt to bypass rate limits.

## Resources
- Typefully at https://typefully.com
- Typefully API Docs at https://docs.typefully.com
- X Automation Rules at https://help.x.com/en/rules-and-policies/x-automation
