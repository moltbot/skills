# SABnzbd Skill

Manage Usenet downloads via SABnzbd from Clawdbot.

## What It Does

- **Queue management** — view, pause, resume, delete downloads
- **Add NZBs** — by URL or local file
- **Speed control** — limit download speeds
- **History** — view completed/failed downloads, retry failed
- **Categories & scripts** — organize and automate

## Setup

### 1. Get Your API Key

1. Open SABnzbd web UI
2. Go to **Config → General → Security**
3. Copy your **API Key**

### 2. Create Credentials File

```bash
mkdir -p ~/.clawdbot/credentials/sabnzbd
cat > ~/.clawdbot/credentials/sabnzbd/config.json << 'EOF'
{
  "url": "http://localhost:8080",
  "apiKey": "your-api-key-here"
}
EOF
```

Replace:
- `http://localhost:8080` with your SABnzbd URL
- `your-api-key-here` with your actual API key

### 3. Test It

```bash
./skills/sabnzbd/scripts/sab-api.sh status
```

## Usage Examples

### Queue management

```bash
# View queue
sab-api.sh queue

# Pause/resume all
sab-api.sh pause
sab-api.sh resume

# Pause specific job
sab-api.sh pause-job SABnzbd_nzo_xxxxx
```

### Add downloads

```bash
# Add by URL
sab-api.sh add "https://indexer.com/get.php?guid=..."

# Add with options
sab-api.sh add "URL" --name "My Download" --category movies --priority high

# Add local NZB file
sab-api.sh add-file /path/to/file.nzb --category tv
```

### Speed control

```bash
sab-api.sh speedlimit 50    # 50% of max
sab-api.sh speedlimit 5M    # 5 MB/s
sab-api.sh speedlimit 0     # Unlimited
```

### History

```bash
sab-api.sh history
sab-api.sh history --limit 20 --failed
sab-api.sh retry <nzo_id>       # Retry failed
sab-api.sh retry-all            # Retry all failed
```

## Environment Variables (Alternative)

Instead of a config file, you can set:

```bash
export SAB_URL="http://localhost:8080"
export SAB_API_KEY="your-api-key"
```

## Troubleshooting

**"Missing URL or API key"**  
→ Check your config file exists at `~/.clawdbot/credentials/sabnzbd/config.json`

**Connection refused**  
→ Verify your SABnzbd URL is correct and accessible

**401 Unauthorized**  
→ Your API key is invalid — check SABnzbd Config → General

## License

MIT
