---
name: searxng
description: Search the web using a self-hosted SearXNG instance. Privacy-respecting metasearch that aggregates results from multiple engines.
metadata:
  clawdbot:
    config:
      optionalEnv:
        - SEARXNG_URL
---

# SearXNG Search Skill

Search the web using your self-hosted SearXNG instance. Privacy-respecting metasearch that aggregates results from Google, DuckDuckGo, Brave, Startpage, and 70+ other engines.

## Prerequisites

SearXNG running locally or on a server. Quick Docker setup:

```bash
mkdir -p ~/Projects/searxng/searxng
cd ~/Projects/searxng

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
services:
  searxng:
    image: searxng/searxng:latest
    container_name: searxng
    ports:
      - "8080:8080"
    volumes:
      - ./searxng:/etc/searxng:rw
    environment:
      - SEARXNG_BASE_URL=http://localhost:8080/
    restart: unless-stopped
EOF

# Create settings.yml with JSON API enabled
cat > searxng/settings.yml << 'EOF'
use_default_settings: true
server:
  secret_key: "change-me-to-random-string"
  bind_address: "0.0.0.0"
  port: 8080
search:
  safe_search: 0
  autocomplete: "google"
  default_lang: "en"
  formats:
    - html
    - json
EOF

# Start SearXNG
docker compose up -d
```

## Configuration

Set the SearXNG URL (defaults to http://localhost:8080):
```bash
export SEARXNG_URL="http://localhost:8080"
```

## Usage Examples

### Basic Search
```bash
curl "http://localhost:8080/search?q=your+query&format=json" | jq '.results[:5]'
```

### Search with Categories
```bash
# General web search
curl "http://localhost:8080/search?q=query&categories=general&format=json"

# Images
curl "http://localhost:8080/search?q=query&categories=images&format=json"

# News
curl "http://localhost:8080/search?q=query&categories=news&format=json"

# Videos
curl "http://localhost:8080/search?q=query&categories=videos&format=json"

# IT/Tech documentation
curl "http://localhost:8080/search?q=query&categories=it&format=json"

# Science/Academic
curl "http://localhost:8080/search?q=query&categories=science&format=json"
```

### Search with Language/Region
```bash
curl "http://localhost:8080/search?q=query&language=en-US&format=json"
curl "http://localhost:8080/search?q=query&language=de-DE&format=json"
```

### Paginated Results
```bash
# Page 2 (results 11-20)
curl "http://localhost:8080/search?q=query&pageno=2&format=json"
```

## Response Format

Each result includes:
- `title` - Result title
- `url` - Link to the result  
- `content` - Snippet/description
- `engines` - Array of search engines that returned this result
- `score` - Relevance score (higher = better)
- `category` - Result category

## Shell Function

Add to your `.zshrc` or `.bashrc`:

```bash
searxng() {
  local query="$*"
  local url="${SEARXNG_URL:-http://localhost:8080}"
  curl -s "${url}/search?q=$(echo "$query" | sed 's/ /+/g')&format=json" | \
    jq -r '.results[:10][] | "[\(.score | floor)] \(.title)\n    \(.url)\n    \(.content // "No description")\n"'
}
```

Usage: `searxng how to make sourdough bread`

## Docker Management

```bash
# Start
cd ~/Projects/searxng && docker compose up -d

# Stop
docker compose down

# View logs
docker compose logs -f searxng

# Restart
docker compose restart
```

## Troubleshooting

**Container won't start:**
```bash
docker compose logs searxng
```

**JSON format not working:**
Ensure `formats: [html, json]` is in your settings.yml

**No results:**
Some engines may be rate-limited. Check logs for errors.

## Why SearXNG?

- **Privacy**: No tracking, no ads, no data collection
- **Aggregation**: Combines results from 70+ search engines
- **Self-hosted**: Your data stays on your machine
- **API**: JSON output for automation
- **Free**: No API keys or rate limits
