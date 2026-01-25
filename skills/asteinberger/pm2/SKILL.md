---
name: pm2
description: Manage Node.js applications with PM2 process manager. Use for deploying, monitoring, and auto-restarting Node apps in production. Covers starting apps, viewing logs, setting up auto-start on boot, and managing multiple processes.
---

# PM2 Process Manager

Production process manager for Node.js with built-in load balancer.

## Install

```bash
npm install -g pm2
```

## Quick Start

```bash
# Start an app
pm2 start app.js
pm2 start npm --name "my-app" -- start
pm2 start "npm run start" --name my-app

# With specific port/env
pm2 start npm --name "my-app" -- start -- --port 3000
PORT=3000 pm2 start npm --name "my-app" -- start
```

## Common Commands

```bash
# List processes
pm2 list
pm2 ls

# Logs
pm2 logs              # All logs
pm2 logs my-app       # Specific app
pm2 logs --lines 100  # Last 100 lines

# Control
pm2 restart my-app
pm2 stop my-app
pm2 delete my-app
pm2 reload my-app     # Zero-downtime reload

# Info
pm2 show my-app
pm2 monit             # Real-time monitor
```

## Auto-Start on Boot

```bash
# Save current process list
pm2 save

# Generate startup script (run the output command with sudo)
pm2 startup

# Example output - run this:
# sudo env PATH=$PATH:/opt/homebrew/bin pm2 startup launchd -u username --hp /Users/username
```

## Next.js / Production Builds

```bash
# Build first
npm run build

# Start production server
pm2 start npm --name "my-app" -- start

# Or with ecosystem file
pm2 start ecosystem.config.js
```

## Ecosystem File (ecosystem.config.js)

```javascript
module.exports = {
  apps: [{
    name: 'my-app',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/app',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

## Useful Flags

| Flag | Description |
|------|-------------|
| `--name` | Process name |
| `--watch` | Restart on file changes |
| `-i max` | Cluster mode (all CPUs) |
| `--max-memory-restart 200M` | Auto-restart on memory limit |
| `--cron "0 * * * *"` | Scheduled restart |

## Cleanup

```bash
pm2 delete all        # Remove all processes
pm2 kill              # Kill PM2 daemon
pm2 unstartup         # Remove startup script
```
