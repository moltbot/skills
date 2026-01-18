---
name: exe-dev
description: Manage persistent VMs on exe.dev. Create VMs, configure HTTP proxies, share access, and set up custom domains. Use when working with exe.dev VMs for hosting, development, or running persistent services.
author: Benjamin Jesuiter
---

> ⚠️ **Warning:** This skill was auto-built by clawdbot from the exe.dev markdown documentation. It's not tested yet — use with caution! I plan to test it soon. 🔜

# exe.dev VM Management

## Quick Commands

| Task | Command |
|------|---------|
| List VMs | `ssh exe.dev ls --json` |
| Create VM | `ssh exe.dev new` |
| Make public | `ssh exe.dev share set-public <vm>` |
| Change port | `ssh exe.dev share port <vm> <port>` |
| Add user | `ssh exe.dev share add <vm> <email>` |
| Share link | `ssh exe.dev share add-link <vm>` |

## Access URLs

- **VM**: `https://<vmname>.exe.xyz/`
- **Shelley agent**: `https://<vmname>.exe.xyz:9999/`
- **VSCode**: `vscode://vscode-remote/ssh-remote+<vmname>.exe.xyz/home/exedev`

## Proxy Configuration

Default port is auto-selected from Dockerfile EXPOSE. Change with:
```bash
ssh exe.dev share port <vmname> <port>
```

Access ports 3000-9999 via `https://vmname.exe.xyz:<port>/`

## Authentication Headers

When users authenticate via exe.dev:
- `X-ExeDev-UserID` — user identifier
- `X-ExeDev-Email` — user email

For testing, use mitmproxy to inject headers:
```bash
mitmdump --mode reverse:http://localhost:8000 --listen-port 3000 \
  --set modify_headers='/~q/X-ExeDev-Email/user@example.com'
```

## Custom Domains

- **Subdomains**: CNAME `app.example.com` → `vmname.exe.xyz`
- **Apex**: ALIAS `example.com` → `exe.xyz` + CNAME `www` → `vmname.exe.xyz`

## Full Reference

See [references/exe-dev-vm-service.md](exe-dev-vm-service.md) for complete documentation including pricing, Shelley agent setup, SSH key config, and FAQ.
