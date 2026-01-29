---
name: curl-http
description: Essential curl commands for HTTP requests, API testing, and file transfers.
homepage: https://curl.se/
metadata: {"clawdbot":{"emoji":"🌐","requires":{"bins":["curl"]}}}
---

# curl - HTTP Client

Command-line tool for making HTTP requests and transferring data.

## Basic Requests

### GET requests
```bash
# Simple GET request
curl https://api.example.com

# Save output to file
curl https://example.com -o output.html
curl https://example.com/file.zip -O  # Use remote filename

# Follow redirects
curl -L https://example.com

# Show response headers
curl -i https://example.com

# Show only headers
curl -I https://example.com

# Verbose output (debugging)
curl -v https://example.com
```

### POST requests
```bash
# POST with data
curl -X POST https://api.example.com/users \
  -d "name=John&email=john@example.com"

# POST JSON data
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com"}'

# POST from file
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -d @data.json

# Form upload
curl -X POST https://api.example.com/upload \
  -F "file=@document.pdf" \
  -F "description=My document"
```

### Other HTTP methods
```bash
# PUT request
curl -X PUT https://api.example.com/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane"}'

# DELETE request
curl -X DELETE https://api.example.com/users/1

# PATCH request
curl -X PATCH https://api.example.com/users/1 \
  -H "Content-Type: application/json" \
  -d '{"email":"newemail@example.com"}'
```

## Headers & Authentication

### Custom headers
```bash
# Add custom header
curl -H "User-Agent: MyApp/1.0" https://example.com

# Multiple headers
curl -H "Accept: application/json" \
     -H "Authorization: Bearer token123" \
     https://api.example.com
```

### Authentication
```bash
# Basic auth
curl -u username:password https://api.example.com

# Bearer token
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.example.com

# API key in header
curl -H "X-API-Key: your_api_key" \
  https://api.example.com

# API key in URL
curl "https://api.example.com?api_key=your_key"
```

## Advanced Features

### Timeouts & retries
```bash
# Connection timeout (seconds)
curl --connect-timeout 10 https://example.com

# Max time for entire operation
curl --max-time 30 https://example.com

# Retry on failure
curl --retry 3 https://example.com

# Retry delay
curl --retry 3 --retry-delay 5 https://example.com
```

### Cookies
```bash
# Send cookies
curl -b "session=abc123" https://example.com

# Save cookies to file
curl -c cookies.txt https://example.com

# Load cookies from file
curl -b cookies.txt https://example.com

# Both save and load
curl -b cookies.txt -c cookies.txt https://example.com
```

### Proxy
```bash
# Use HTTP proxy
curl -x http://proxy.example.com:8080 https://api.example.com

# With proxy authentication
curl -x http://proxy:8080 -U user:pass https://api.example.com

# SOCKS proxy
curl --socks5 127.0.0.1:1080 https://api.example.com
```

### SSL/TLS
```bash
# Ignore SSL certificate errors (not recommended for production)
curl -k https://self-signed.example.com

# Use specific SSL version
curl --tlsv1.2 https://example.com

# Use client certificate
curl --cert client.crt --key client.key https://example.com

# Show SSL handshake details
curl -v https://example.com 2>&1 | grep -i ssl
```

## Response Handling

### Output formatting
```bash
# Silent mode (no progress bar)
curl -s https://api.example.com

# Show only HTTP status code
curl -s -o /dev/null -w "%{http_code}" https://example.com

# Custom output format
curl -w "\nTime: %{time_total}s\nStatus: %{http_code}\n" \
  https://example.com

# Pretty print JSON (with jq)
curl -s https://api.example.com | jq '.'
```

### Range requests
```bash
# Download specific byte range
curl -r 0-1000 https://example.com/large-file.zip

# Resume download
curl -C - -O https://example.com/large-file.zip
```

## File Operations

### Downloading files
```bash
# Download file
curl -O https://example.com/file.zip

# Download with custom name
curl -o myfile.zip https://example.com/file.zip

# Download multiple files
curl -O https://example.com/file1.zip \
     -O https://example.com/file2.zip

# Resume interrupted download
curl -C - -O https://example.com/large-file.zip
```

### Uploading files
```bash
# FTP upload
curl -T file.txt ftp://ftp.example.com/upload/

# HTTP PUT upload
curl -T file.txt https://example.com/upload

# Form file upload
curl -F "file=@document.pdf" https://example.com/upload
```

## Testing & Debugging

### API testing
```bash
# Test REST API
curl -X GET https://api.example.com/users
curl -X GET https://api.example.com/users/1
curl -X POST https://api.example.com/users -d @user.json
curl -X PUT https://api.example.com/users/1 -d @updated.json
curl -X DELETE https://api.example.com/users/1

# Test with verbose output
curl -v -X POST https://api.example.com/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"pass"}'
```

### Performance testing
```bash
# Measure request time
curl -w "Total time: %{time_total}s\n" https://example.com

# Detailed timing
curl -w "\nDNS: %{time_namelookup}s\nConnect: %{time_connect}s\nTLS: %{time_appconnect}s\nTransfer: %{time_starttransfer}s\nTotal: %{time_total}s\n" \
  -o /dev/null -s https://example.com
```

### Common debugging
```bash
# Show request and response headers
curl -v https://api.example.com

# Trace request
curl --trace-ascii trace.txt https://api.example.com

# Include response headers in output
curl -i https://api.example.com
```

## Common Patterns

**Quick JSON API test:**
```bash
curl -s https://api.github.com/users/octocat | jq '{name, bio, followers}'
```

**Download with progress bar:**
```bash
curl -# -O https://example.com/large-file.zip
```

**POST JSON and extract field:**
```bash
curl -s -X POST https://api.example.com/login \
  -H "Content-Type: application/json" \
  -d '{"user":"test","pass":"secret"}' | jq -r '.token'
```

**Check if URL is accessible:**
```bash
if curl -s --head --fail https://example.com > /dev/null; then
  echo "Site is up"
else
  echo "Site is down"
fi
```

**Parallel downloads:**
```bash
for i in {1..10}; do
  curl -O https://example.com/file$i.jpg &
done
wait
```

## Useful Flags

- `-X`: HTTP method (GET, POST, PUT, DELETE, etc.)
- `-d`: Data to send (POST/PUT)
- `-H`: Custom header
- `-o`: Output file
- `-O`: Save with remote filename
- `-L`: Follow redirects
- `-i`: Include headers in output
- `-I`: Headers only
- `-v`: Verbose output
- `-s`: Silent mode
- `-S`: Show errors even in silent mode
- `-f`: Fail silently on HTTP errors
- `-k`: Insecure (ignore SSL)
- `-u`: Basic authentication
- `-F`: Multipart form data
- `-b`: Send cookies
- `-c`: Save cookies
- `-w`: Custom output format

## Tips

- Use `-s` in scripts to suppress progress bar
- Combine `-sS` for silent but show errors
- Use `-L` for redirects (e.g., shortened URLs)
- Add `-v` for debugging
- Use `jq` to process JSON responses
- Save common requests as shell aliases or scripts
- Use `--config` for complex reusable requests

## Documentation

Official docs: https://curl.se/docs/
Manual: `man curl`
HTTP methods: https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods
