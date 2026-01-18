---
title: exe.dev - Persistent VMs on the Internet
anchor: How to use exe.dev for persistent VMs with HTTP proxies and sharing
tags: [vm, hosting, ssh, proxy, cloud, persistent-servers]
description: Subscription service for persistent virtual machines accessible over HTTPS with built-in auth, sharing, and custom domains
source_url: https://exe.dev/docs/all.md
---

## exe.dev Reference

**What it is:** VMs on the internet, quickly. Persistent virtual machines with HTTPS access, built-in auth, and sharing features.

### Quick Start

```bash
ssh exe.dev new  # Create a new VM
ssh exe.dev ls   # List your VMs
```

### Pricing (Alpha - free trial currently)

| Individual | Team | Enterprise |
|------------|------|------------|
| $20/mo | $25/mo/user | $30/mo/user |
| 25 VMs, 2 CPUs, 8GB RAM | 25 VMs + SSO/Admin | 30 VMs + AWS VPC |

### Core Features

**VMs**
- Persistent disks (25GB included, $0.08/GB/month extra)
- Shared CPU/RAM across all your VMs
- Full Linux VMs (default: exeuntu image)
- Docker supported

**HTTP Proxies**
- Auto-proxies `https://vmname.exe.xyz/` to your VM
- Configurable ports (3000-9999)
- `X-Forwarded-*` headers included

**Sharing**
- `share set-public <vm>` — make publicly accessible
- `share add <vm> <email>` — invite specific users
- `share add-link <vm>` — generate share link

**Custom Domains**
- CNAME records for subdomains: `app.example.com CNAME vmname.exe.xyz`
- ALIAS + CNAME for apex domains

**Authentication Headers**
- `X-ExeDev-UserID` — unique user identifier
- `X-ExeDev-Email` — user's email

**Login URLs**
- `https://vmname.exe.xyz/__exe.dev/login?redirect={path}`
- POST `https://vmname.exe.xyz/__exe.dev/logout`

### SSH Commands

```bash
ssh exe.dev ls --json              # List VMs
ssh exe.dev new                    # Create VM
ssh exe.dev share set-public <vm>  # Make public
ssh exe.dev share port <vm> <port> # Change proxy port
ssh exe.dev share add <vm> <email> # Add user
ssh exe.dev share add-link <vm>    # Generate link
```

### Shelley (Coding Agent)

- Pre-installed on default exeuntu image at port 9999
- Access: `https://vmname.exe.xyz:9999/`
- Reads `~/.config/shelley/AGENTS.md` and project `AGENTS.md`
- Update: `shelley install <vm>`

### FAQ

**Host key fingerprint:**
```
SHA256:JJOP/lwiBGOMilfONPWZCXUrfK154cnJFXcqlsi6lPo
```

**VSCode Remote:**
```
vscode://vscode-remote/ssh-remote+<vmname>.exe.xyz/home/exedev
```

**File transfer:** `scp <local-file> <vmname>.exe.xyz:`

**Pronunciation:** "EX-ee"
