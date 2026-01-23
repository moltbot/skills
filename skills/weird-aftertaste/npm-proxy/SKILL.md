---
name: npm-proxy
description: Manage Nginx Proxy Manager (NPM) hosts, certificates, and access lists. Use when the user wants to add a new domain, point a domain to a server/port, enable SSL, or check the status of proxy hosts.
---

# NPM Proxy Skill

Manage Nginx Proxy Manager (NPM) via its REST API.

## Configuration

Set the following environment variables:
- `NPM_URL`: The URL of your NPM instance (e.g., `https://npm.example.com`)
- `NPM_EMAIL`: Your NPM admin email
- `NPM_PASSWORD`: Your NPM admin password

## Usage

```bash
# List all proxy hosts
python scripts/npm_client.py hosts

# Get details for a specific host
python scripts/npm_client.py host <host_id>

# Enable/Disable a host
python scripts/npm_client.py enable <host_id>
python scripts/npm_client.py disable <host_id>

# Delete a host
python scripts/npm_client.py delete <host_id>

# List certificates
python scripts/npm_client.py certs
```

## Workflows

### Adding a new Proxy Host
To add a new host, use `curl` directly (the script is currently minimal).
Example payload for `POST /api/nginx/proxy-hosts`:
```json
{
  "domain_names": ["sub.example.com"],
  "forward_scheme": "http",
  "forward_host": "192.168.1.10",
  "forward_port": 8080,
  "access_list_id": 0,
  "certificate_id": 0,
  "ssl_forced": false,
  "meta": {
    "letsencrypt_email": "",
    "letsencrypt_agree": false,
    "dns_challenge": false
  },
  "advanced_config": "",
  "locations": [],
  "block_exploits": true,
  "caching_enabled": false,
  "allow_websocket_upgrade": true,
  "http2_support": true,
  "hsts_enabled": false,
  "hsts_subdomains": false
}
```

### Enabling SSL (Let's Encrypt)
1. List certs with `certs` to see if one exists.
2. Update the host with `certificate_id` and `ssl_forced: true`.
