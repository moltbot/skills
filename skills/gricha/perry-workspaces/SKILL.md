---
name: perry-workspaces
description: Create and manage isolated Docker workspaces on your tailnet with Claude Code and OpenCode pre-installed. Use when working with Perry workspaces, connecting to coding agents, or managing remote development environments.
---

# Perry Usage

Perry runs a local agent that creates isolated Docker workspaces and advertises them on your tailnet. Each workspace has coding agents preinstalled and is reachable via CLI, web UI, or SSH.

## Quick start

```bash
# Install
curl -fsSL https://raw.githubusercontent.com/gricha/perry/main/install.sh | bash

# Run the agent
perry agent run

# Point your CLI at the agent (one-time)
perry config agent <hostname>

# Create a workspace (optional clone)
perry start my-proj --clone git@github.com:user/repo.git

# Shell into it
perry shell my-proj
```

Expected behavior:
- `perry agent run` starts a local daemon.
- `perry start` creates a `workspace-my-proj` container and registers it on your tailnet.
- `perry shell` opens an interactive shell inside the workspace.

## OpenCode workflow

```bash
# Attach via CLI
opencode attach http://my-proj:4096
```

Expected behavior:
- OpenCode is reachable at `http://<workspace>:4096` from any device on the tailnet.
- You can open the same URL in a browser.

Gotchas:
- If `:4096` is unreachable, verify tailnet connectivity and that the workspace is running.

## Claude Code workflow

```bash
# Run from a workspace shell
perry shell my-proj
claude
```

Expected behavior:
- Claude Code runs inside the workspace shell.
- Remote access to the workspace shell can be done via Perry web UI or a mobile terminal app.

Gotchas:
- You do not attach to Claude Code over HTTP; use it inside the workspace shell.

## SSH access

```bash
# Use 'workspace' as the username
ssh workspace@my-proj
```

Expected behavior:
- The workspace user is always `workspace` (not your local username).
- The workspace inherits authorized keys from the host after `perry sync`.
- Workspaces are registered on your tailnet by name (e.g., `my-proj`).

Gotchas:
- If SSH fails, ensure your key is authorized via `perry ssh authorize <key-path>` and synced with `perry sync --all`.
- The username is `workspace`, not your local user or `root`.

## Common commands

```bash
# List workspaces
perry ls

# Stop a workspace
perry stop my-proj

# Remove a workspace
perry remove my-proj
```

## Troubleshooting

- Workspace not reachable: confirm Tailscale is running and the workspace name resolves.
- Port conflicts: if you changed ports, update your attach URL.
- Slow start: workspace setup can take time; check the web UI for startup progress.

## Naming conventions

- Containers are `workspace-<name>`.
- Internal resources use `workspace-internal-<name>`.

## References

- Getting Started: https://gricha.github.io/perry/docs/getting-started
- OpenCode workflow: https://gricha.github.io/perry/docs/workflows/opencode
- Claude Code workflow: https://gricha.github.io/perry/docs/workflows/claude-code
