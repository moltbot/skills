---
name: cloudflare
description: Manage Cloudflare Workers, KV, D1, R2, and secrets using the Wrangler CLI. Use when deploying workers, managing databases, storing objects, or configuring Cloudflare resources. Covers worker deployment, KV namespaces, D1 SQL databases, R2 object storage, secrets management, and tailing logs.
---

# Cloudflare (Wrangler CLI)

Manage Cloudflare Workers and associated services via the `wrangler` CLI.

## Prerequisites

- Node.js v20+ required
- Install: `npm install -g wrangler` or use project-local `npx wrangler`
- Auth: `wrangler login` (opens browser for OAuth)
- Verify: `wrangler whoami`

## Quick Reference

### Workers

```bash
# Initialize new worker
wrangler init <name>

# Local development
wrangler dev [script]

# Deploy
wrangler deploy [script]

# List deployments
wrangler deployments list

# View deployment
wrangler deployments view [deployment-id]

# Rollback
wrangler rollback [version-id]

# Delete worker
wrangler delete [name]

# Tail logs (live)
wrangler tail [worker]
```

### Secrets

```bash
# Add/update secret (interactive)
wrangler secret put <key>

# Add secret from stdin
echo "value" | wrangler secret put <key>

# List secrets
wrangler secret list

# Delete secret
wrangler secret delete <key>

# Bulk upload from JSON file
wrangler secret bulk secrets.json
```

### KV (Key-Value Store)

```bash
# Create namespace
wrangler kv namespace create <name>

# List namespaces
wrangler kv namespace list

# Delete namespace
wrangler kv namespace delete --namespace-id <id>

# Put key
wrangler kv key put <key> <value> --namespace-id <id>

# Get key
wrangler kv key get <key> --namespace-id <id>

# Delete key
wrangler kv key delete <key> --namespace-id <id>

# List keys
wrangler kv key list --namespace-id <id>

# Bulk operations (JSON file)
wrangler kv bulk put <file> --namespace-id <id>
wrangler kv bulk delete <file> --namespace-id <id>
```

### D1 (SQL Database)

```bash
# Create database
wrangler d1 create <name>

# List databases
wrangler d1 list

# Database info
wrangler d1 info <name>

# Execute SQL
wrangler d1 execute <database> --command "SELECT * FROM users"

# Execute SQL file
wrangler d1 execute <database> --file schema.sql

# Local execution (for dev)
wrangler d1 execute <database> --local --command "..."

# Export database
wrangler d1 export <name> --output backup.sql

# Delete database
wrangler d1 delete <name>

# Migrations
wrangler d1 migrations create <database> <name>
wrangler d1 migrations apply <database>
wrangler d1 migrations list <database>
```

### R2 (Object Storage)

```bash
# Create bucket
wrangler r2 bucket create <name>

# List buckets
wrangler r2 bucket list

# Delete bucket
wrangler r2 bucket delete <name>

# Upload object
wrangler r2 object put <bucket>/<key> --file <path>

# Download object
wrangler r2 object get <bucket>/<key> --file <path>

# Delete object
wrangler r2 object delete <bucket>/<key>
```

### Queues

```bash
# Create queue
wrangler queues create <name>

# List queues
wrangler queues list

# Delete queue
wrangler queues delete <name>
```

## Configuration Files

Wrangler supports both TOML and JSON/JSONC config formats:

- `wrangler.toml` — traditional format
- `wrangler.json` or `wrangler.jsonc` — newer, with JSON schema support

**⚠️ Important:** If both exist, JSON takes precedence. Pick one format to avoid confusion where edits to TOML are ignored.

### JSONC format (with schema autocomplete)

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2024-12-30"
}
```

### TOML format

```toml
name = "my-worker"
main = "src/index.ts"
compatibility_date = "2024-12-30"
```

With bindings:

```toml
name = "my-worker"
main = "src/index.ts"
compatibility_date = "2024-12-30"

# KV binding
[[kv_namespaces]]
binding = "MY_KV"
id = "xxx"

# D1 binding
[[d1_databases]]
binding = "DB"
database_name = "my-db"
database_id = "xxx"

# R2 binding
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "my-bucket"

# Environment variables
[vars]
API_URL = "https://api.example.com"

# Secrets (set via `wrangler secret put`)
# Referenced as env.SECRET_NAME in worker code
```

Static assets (for frameworks like Next.js):

```toml
name = "my-site"
main = ".open-next/worker.js"
compatibility_date = "2024-12-30"
compatibility_flags = ["nodejs_compat"]

[assets]
directory = ".open-next/assets"
binding = "ASSETS"
```

## Common Patterns

### Deploy with environment

```bash
wrangler deploy -e production
wrangler deploy -e staging
```

### Custom domain (via dashboard or API)

Custom domains must be configured in the Cloudflare dashboard under Worker Settings > Domains & Routes, or via the Cloudflare API. Wrangler doesn't directly manage custom domains.

### Local development with bindings

```bash
# Creates local D1/KV/R2 for dev
wrangler dev --local
```

### Checking deployment status

```bash
wrangler deployments list
wrangler deployments view
```

## What Wrangler Does NOT Do

- **DNS management** — Use the Cloudflare dashboard or API for DNS records
- **Custom domains** — Configure via dashboard (Worker Settings > Domains & Routes) or API
- **SSL certificates** — Managed automatically by Cloudflare when custom domains are added
- **Firewall/WAF rules** — Use dashboard or API

For DNS/domain management, see the `cloudflare` skill (uses Cloudflare API directly).

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Not authenticated" | Run `wrangler login` |
| Node version error | Requires Node.js v20+ |
| "No config found" | Ensure config file exists (`wrangler.toml` or `wrangler.jsonc`) or use `-c path/to/config` |
| Config changes ignored | Check for `wrangler.json`/`wrangler.jsonc` — JSON takes precedence over TOML |
| Binding not found | Check `wrangler.toml` bindings match code references |

## Resources

- [Wrangler Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Workers Docs](https://developers.cloudflare.com/workers/)
- [D1 Docs](https://developers.cloudflare.com/d1/)
- [R2 Docs](https://developers.cloudflare.com/r2/)
- [KV Docs](https://developers.cloudflare.com/kv/)
