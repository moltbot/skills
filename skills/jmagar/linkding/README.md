# Linkding Skill

Manage bookmarks via Linkding REST API from Clawdbot.

## What It Does

- **Bookmarks** — list, search, create, update, archive, delete
- **Tags** — list and create tags
- **Bundles** — saved searches with filters
- **Check URLs** — see if a link is already bookmarked

## Setup

### 1. Get Your API Token

1. Open your Linkding web UI
2. Go to **Settings**
3. Find the **REST API** section
4. Copy your **API Token**

### 2. Create Credentials File

```bash
mkdir -p ~/.clawdbot/credentials/linkding
cp config.json.example ~/.clawdbot/credentials/linkding/config.json
# Edit with your actual values
```

Or create manually:

```json
{
  "url": "https://linkding.example.com",
  "apiKey": "your-api-token-here"
}
```

### 3. Test It

```bash
./scripts/linkding-api.sh bookmarks --limit 5
```

## Usage Examples

### List and search bookmarks

```bash
# Recent bookmarks
linkding-api.sh bookmarks

# Search by keyword
linkding-api.sh bookmarks --query "python tutorial"

# Archived bookmarks
linkding-api.sh bookmarks --archived

# With pagination
linkding-api.sh bookmarks --limit 20 --offset 40
```

### Create bookmark

```bash
# Basic
linkding-api.sh create "https://example.com"

# With metadata
linkding-api.sh create "https://example.com" \
  --title "Example Site" \
  --description "A great resource" \
  --tags "reference,docs"

# Create and archive immediately
linkding-api.sh create "https://example.com" --archived
```

### Check if URL exists

```bash
linkding-api.sh check "https://example.com"
```

### Manage bookmarks

```bash
# Update
linkding-api.sh update 123 --title "New Title" --tags "newtag"

# Archive/unarchive
linkding-api.sh archive 123
linkding-api.sh unarchive 123

# Delete
linkding-api.sh delete 123
```

### Tags

```bash
linkding-api.sh tags           # List all tags
linkding-api.sh tag-create "mytag"
```

### Bundles (saved searches)

```bash
linkding-api.sh bundles        # List bundles

linkding-api.sh bundle-create "Work Resources" \
  --search "productivity" \
  --any-tags "work,tools"
```

## Environment Variables (Alternative)

```bash
export LINKDING_URL="https://linkding.example.com"
export LINKDING_API_KEY="your-api-token"
```

## Troubleshooting

**"LINKDING_URL and LINKDING_API_KEY must be set"**  
→ Check your config file exists at `~/.clawdbot/credentials/linkding/config.json`

**401 Unauthorized**  
→ Your API token is invalid — regenerate it in Linkding settings

## License

MIT
