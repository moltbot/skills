---
name: private-connect
description: Access private services by name, from anywhere. No VPN or SSH tunnels.
homepage: https://privateconnect.co
repository: https://github.com/treadiehq/private-connect
author: Treadie
gating:
  binary: connect
---

# Private Connect

Access private services by name, from anywhere. No VPN or SSH tunnels needed.

## What it does

Private Connect lets you reach private infrastructure (databases, APIs, GPU clusters) using simple names instead of IPs and ports. Share your dev environment with teammates in seconds.

## Commands

### connect_reach
Connect to a private service by name.

**Examples:**
- "Connect me to the staging database"
- "Reach the prod API"
- "Connect to jupyter-gpu"

### connect_status
Show available services and their connection status.

**Examples:**
- "What services are available?"
- "Show my connected services"
- "Is the staging database online?"

### connect_share
Share your current environment with a teammate.

**Examples:**
- "Share my environment"
- "Create a share link that expires in 7 days"
- "Share my setup with the team for a week"

### connect_join
Join a shared environment from a teammate.

**Examples:**
- "Join share code x7k9m2"
- "Connect to Bob's environment"

### connect_clone
Clone a teammate's entire environment setup.

**Examples:**
- "Clone Alice's environment"
- "Set up my environment like the senior dev"

### connect_list_shares
List active environment shares.

**Examples:**
- "Show my active shares"
- "What environments am I sharing?"

### connect_revoke
Revoke a shared environment.

**Examples:**
- "Revoke share x7k9m2"
- "Stop sharing with the contractor"

## Setup

1. Install Private Connect:
```bash
curl -fsSL https://privateconnect.co/install.sh | bash
```

2. Authenticate:
```bash
connect up
```

3. The skill will use your authenticated session.

## Requirements

- Private Connect CLI installed and authenticated
- `connect` command available in PATH

