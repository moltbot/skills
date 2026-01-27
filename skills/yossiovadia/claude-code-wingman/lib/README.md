# Helper Library for Claude Code Orchestration

This directory contains modular helper scripts for managing Claude Code sessions in tmux.

## Scripts

### session-send.sh
Send a command to an existing Claude Code session.

**Usage:**
```bash
./lib/session-send.sh <session-name> <command> [options]
```

**Options:**
- `--force, -f` - Send without checking session state
- `--timeout, -t N` - Wait up to N seconds for idle state (default: 30)
- `--quiet, -q` - Suppress output messages

**Example:**
```bash
./lib/session-send.sh my-session "Read the README file"
./lib/session-send.sh my-session "Fix the bug" --timeout 60
./lib/session-send.sh my-session "Quick task" --force
```

**Features:**
- Validates session exists
- Checks session state before sending (waits for idle, fails on waiting_approval/error)
- Smart retry: sends Enter again if session remains idle after first attempt
- Configurable timeout for waiting on busy sessions
- Force mode for bypassing state checks

---

### approval-respond.sh
Send an approval response to a Claude Code session waiting for approval.

**Usage:**
```bash
./lib/approval-respond.sh <session-name> <response>
```

**Response options:**
- `y`, `yes`, `approve` - Approve this one action
- `always`, `all` - Approve all actions for this session
- `n`, `no`, `deny` - Deny this action
- `never` - Never approve (for traditional prompts)

**Example:**
```bash
./lib/approval-respond.sh my-session always
```

**Features:**
- Handles both menu-style and traditional approval prompts
- Uses arrow key navigation for menu selections
- Validates session exists
- Normalizes various response formats

---

### session-status.sh
Get the current status of a Claude Code session.

**Usage:**
```bash
./lib/session-status.sh <session-name> [--json]
```

**Example:**
```bash
./lib/session-status.sh my-session
./lib/session-status.sh my-session --json
```

**Output states:**
- `waiting_approval` - Session is waiting for user approval
- `idle` - Session is ready for input
- `error` - Session has encountered an error
- `working` - Session is actively processing
- `unknown` - Cannot determine state

**JSON output:**
```json
{
  "session": "my-session",
  "status": "waiting_approval",
  "details": "⏺ Write(test.txt)"
}
```

---

## Architecture

These helpers follow the Unix philosophy:
- **Do one thing well** - Each script has a single, focused purpose
- **Composable** - Can be used standalone or combined
- **Simple** - Clear interfaces, easy to understand
- **Testable** - Each can be tested independently

These scripts are used by:
- The main `wingman.sh` orchestrator
- The heartbeat monitoring system
- Direct manual invocation
- Future automation tools

## Integration

The main `wingman.sh` script delegates to these helpers for session management operations, providing a clean user-facing interface while keeping the internals modular and maintainable.
