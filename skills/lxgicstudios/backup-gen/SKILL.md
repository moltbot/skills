---
name: backup-script-gen
description: Generate database backup scripts with AI. Use when you need automated backups to S3, GCS, or local storage.
---

# Backup Script Generator

Setting up database backups involves shell scripts, cron jobs, cloud CLI tools, and retention policies. This tool generates complete backup scripts for any database to any destination.

**One command. Zero config. Just works.**

## Quick Start

```bash
npx ai-backup-script "PostgreSQL daily to S3"
```

## What It Does

- Generates complete backup scripts with error handling
- Supports all major databases (Postgres, MySQL, MongoDB, Redis)
- Handles cloud destinations (S3, GCS, Azure Blob)
- Includes retention and rotation logic

## Usage Examples

```bash
# PostgreSQL to S3
npx ai-backup-script "PostgreSQL daily to S3 with 30 day retention"

# MongoDB to Google Cloud Storage
npx ai-backup-script "MongoDB hourly to GCS"

# MySQL to local with rotation
npx ai-backup-script "MySQL weekly to /backups with 4 week rotation"

# Redis with compression
npx ai-backup-script "Redis snapshot to S3 compressed"
```

## Best Practices

- **Test your restores** - a backup you can't restore is useless
- **Monitor failures** - add alerting to your backup jobs
- **Encrypt at rest** - especially for cloud storage
- **Document the restore process** - future you will thank present you

## When to Use This

- Setting up backups for a new database
- Migrating from manual backups to automated
- Need a quick backup script for a side project
- Want a starting point to customize

## Part of the LXGIC Dev Toolkit

This is one of 110+ free developer tools built by LXGIC Studios. No paywalls, no sign-ups, no API keys on free tiers. Just tools that work.

**Find more:**
- GitHub: https://github.com/LXGIC-Studios
- Twitter: https://x.com/lxgicstudios
- Substack: https://lxgicstudios.substack.com
- Website: https://lxgic.dev

## Requirements

No install needed. Just run with npx. Node.js 18+ recommended. Needs OPENAI_API_KEY environment variable.

```bash
npx ai-backup-script --help
```

## How It Works

Takes your description of database type, schedule, and destination. Generates a shell script using the appropriate dump tool (pg_dump, mysqldump, mongodump, etc.) with proper flags, compression, upload commands, and cleanup logic.

## License

MIT. Free forever. Use it however you want.
