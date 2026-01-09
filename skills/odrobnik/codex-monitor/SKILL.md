---
name: codex-monitor
description: Browse OpenAI Codex session logs stored in ~/.codex/sessions. Provides list/show/watch helpers via the local Swift project at ~/Developer/CodexMonitor.
---

# codex-monitor

Use this skill to query Codex sessions on Oliver’s machine.

## How it works
This skill runs the Swift executables from the local project:
- `~/Developer/CodexMonitor`
- CLI: `swift run CodexMonitor-CLI ...`
- App: `swift run CodexMonitor-App`

## Commands

### List sessions
- Day (text): `python3 skills/codex-monitor/codex_monitor.py list 2026/01/08`
- Day (JSON): `python3 skills/codex-monitor/codex_monitor.py list --json 2026/01/08`
- Month: `python3 skills/codex-monitor/codex_monitor.py list 2026/01`
- Year: `python3 skills/codex-monitor/codex_monitor.py list 2026`

### Show a session (text)
- `python3 skills/codex-monitor/codex_monitor.py show <session-id>`
- With ranges: `python3 skills/codex-monitor/codex_monitor.py show <session-id> --ranges 1...3,26...28`
  - Open-ended: `--ranges 5...` (from #5 to end), `--ranges ...10` (from start through #10)

### Show a session (JSON)
- `python3 skills/codex-monitor/codex_monitor.py show <session-id> --json`

### Watch for changes
- All sessions: `python3 skills/codex-monitor/codex_monitor.py watch`
- Specific session: `python3 skills/codex-monitor/codex_monitor.py watch --session <session-id>`

### Monitor (Menu Bar App)
- Launch the menu bar monitor: `python3 skills/codex-monitor/codex_monitor.py monitor`

## Notes
- The underlying CLI may evolve; this wrapper passes through extra args.
- If the Swift build is slow, consider building once (`swift build`) and then running the built binary.
