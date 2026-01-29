---
name: zellij
description: Remote-control zellij sessions for interactive CLIs by sending keystrokes and scraping pane output.
homepage: https://zellij.dev
metadata: {"moltbot":{"emoji":"🪟","os":["darwin","linux"],"requires":{"bins":["zellij","jq"]},"install":[{"id":"brew","kind":"brew","formula":"zellij","bins":["zellij"],"label":"Install Zellij (brew)"},{"id":"cargo","kind":"cargo","crate":"zellij","bins":["zellij"],"label":"Install Zellij (Cargo)"}]}}
---

# zellij Skill (Moltbot)

Use zellij only when you need an interactive TTY. Prefer exec background mode for long-running, non-interactive tasks.

## Quickstart (data dir, exec tool)

```bash
DATA_DIR="${CLAWDBOT_ZELLIJ_DATA_DIR:-${TMPDIR:-/tmp}/moltbot-zellij-data}"
mkdir -p "$DATA_DIR"
SESSION=moltbot-python

zellij --data-dir "$DATA_DIR" new-session --session "$SESSION" --layout "default" --detach
zellij --data-dir "$DATA_DIR" run --session "$SESSION" --name repl -- python3 -q
zellij --data-dir "$DATA_DIR" pipe --session "$SESSION" --pane-id 0
```

After starting a session, always print monitor commands:

```
To monitor:
  zellij --data-dir "$DATA_DIR" attach --session "$SESSION"
  zellij --data-dir "$DATA_DIR" pipe --session "$SESSION" --pane-id 0
```

## Data directory convention

- Use `CLAWDBOT_ZELLIJ_DATA_DIR` (default `${TMPDIR:-/tmp}/moltbot-zellij-data`).
- Zellij stores state (sessions, plugins, etc.) in this directory.

## Targeting panes and naming

- Zellij uses `pane-id` (numeric) to target specific panes.
- Find pane IDs: `zellij --data-dir "$DATA_DIR" list-sessions --long` or use `list-panes.sh`.
- Keep session names short; avoid spaces.

## Finding sessions

- List sessions on your data dir: `zellij --data-dir "$DATA_DIR" list-sessions`.
- List sessions across all data dirs: `{baseDir}/scripts/find-sessions.sh --all` (uses `CLAWDBOT_ZELLIJ_DATA_DIR`).

## Sending input safely

- Use `zellij action` to send keystrokes: `zellij --data-dir "$DATA_DIR" action --session "$SESSION" write-chars --chars "$cmd"`.
- Control keys: `zellij --data-dir "$DATA_DIR" action --session "$SESSION" write 2` (Ctrl+C).

## Watching output

- Capture pane output: `zellij --data-dir "$DATA_DIR" pipe --session "$SESSION" --pane-id 0`.
- Wait for prompts: `{baseDir}/scripts/wait-for-text.sh -s "$SESSION" -p 0 -p 'pattern'`.
- Attaching is OK; detach with `Ctrl+p d` (zellij default detach).

## Spawning processes

- For python REPLs, zellij works well with standard `python3 -q`.
- No special flags needed like tmux's `PYTHON_BASIC_REPL=1`.

## Windows / WSL

- zellij is supported on macOS/Linux. On Windows, use WSL and install zellij inside WSL.
- This skill is gated to `darwin`/`linux` and requires `zellij` on PATH.

## Orchestrating Coding Agents (Codex, Claude Code)

zellij excels at running multiple coding agents in parallel:

```bash
DATA_DIR="${TMPDIR:-/tmp}/codex-army-data"

# Create multiple sessions
for i in 1 2 3 4 5; do
  zellij --data-dir "$DATA_DIR" new-session --session "agent-$i" --layout "compact" --detach
done

# Launch agents in different workdirs
zellij --data-dir "$DATA_DIR" action --session "agent-1" write-chars --chars "cd /tmp/project1 && codex --yolo 'Fix bug X'\n"
zellij --data-dir "$DATA_DIR" action --session "agent-2" write-chars --chars "cd /tmp/project2 && codex --yolo 'Fix bug Y'\n"

# Poll for completion (check if prompt returned)
for sess in agent-1 agent-2; do
  pane_id=$(zellij --data-dir "$DATA_DIR" list-sessions --long | grep "\"$sess\"" | jq -r '.tabs[0].panes[0].id')
  if zellij --data-dir "$DATA_DIR" pipe --session "$sess" --pane-id "$pane_id" | grep -q "❯"; then
    echo "$sess: DONE"
  else
    echo "$sess: Running..."
  fi
done

# Get full output from completed session
zellij --data-dir "$DATA_DIR" pipe --session "agent-1" --pane-id 0
```

**Tips:**
- Use separate git worktrees for parallel fixes (no branch conflicts)
- `pnpm install` first before running codex in fresh clones
- Check for shell prompt (`❯` or `$`) to detect completion
- Codex needs `--yolo` or `--full-auto` for non-interactive fixes

## Cleanup

- Kill a session: `zellij --data-dir "$DATA_DIR" delete-session --session "$SESSION"`.
- Kill all sessions on a data dir: use `{baseDir}/scripts/cleanup-sessions.sh "$DATA_DIR"`.

## Zellij vs Tmux Quick Reference

| Task | tmux | zellij |
|------|------|--------|
| List sessions | `list-sessions` | `list-sessions` |
| Create session | `new-session -d` | `new-session --detach` |
| Attach | `attach -t` | `attach --session` |
| Send keys | `send-keys` | `action write-chars` |
| Capture pane | `capture-pane` | `pipe` |
| Kill session | `kill-session` | `delete-session` |
| Detach | `Ctrl+b d` | `Ctrl+p d` |

## Helper: wait-for-text.sh

`{baseDir}/scripts/wait-for-text.sh` polls a pane for a regex (or fixed string) with a timeout.

```bash
{baseDir}/scripts/wait-for-text.sh -s session -p pane-id -r 'pattern' [-F] [-T 20] [-i 0.5]
```

- `-s`/`--session` session name (required)
- `-p`/`--pane-id` pane ID (required)
- `-r`/`--pattern` regex to match (required); add `-F` for fixed string
- `-T` timeout seconds (integer, default 15)
- `-i` poll interval seconds (default 0.5)

## Helper: find-panes.sh

`{baseDir}/scripts/find-panes.sh` lists panes for a given session.

```bash
{baseDir}/scripts/find-panes.sh -s session [-d data-dir]
```

- `-s`/`--session` session name (required)
- `-d`/`--data-dir` zellij data dir (uses `CLAWDBOT_ZELLIJ_DATA_DIR` if not specified)
