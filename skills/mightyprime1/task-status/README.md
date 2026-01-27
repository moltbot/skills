# Task Status Skill

A Clawdbot skill for sending short status descriptions in chat, with automatic periodic monitoring that updates every 5 seconds.

## Quick Start

### Install into Clawdbot
```bash
# Copy to Clawdbot skills directory
copy task-status "C:\Users\Luffy\AppData\Roaming\npm\node_modules\clawdbot\skills\task-status"
```

### Usage

#### Manual Updates (Single Status Messages)
```bash
python scripts/send_status.py "Still working..." "progress" "task_name"
python scripts/send_status.py "Complete!" "success" "task_name"
python scripts/send_status.py "Error!" "error" "task_name"
```

#### Automatic Periodic Monitoring (Every 5 seconds)
```bash
# Start monitoring before your long task
python scripts/monitor_task.py start "my_long_task" "progress"

# Your long running task/process here...
# Monitor sends "Still working..." updates every 5 seconds automatically

# Stop monitoring with final status
python scripts/monitor_task.py stop "my_long_task" "success" "Task complete!"
```

## Features

- **Manual Status Updates**: Send one-off status messages
- **Automatic Monitoring**: Periodic "heartbeat" updates every 5 seconds
- **ASCII Fallback**: Uses ASCII symbols (->, OK, !, ?) on Windows CMD
- **Emoji Support**: Uses emojis (🔄, ✅, ❌, ⚠️) on Windows Terminal/PowerShell
- **Background Monitoring**: Runs independently until stopped
- **State Management**: Tracks active monitors in `.task_status_state.json`

## Status Types

| Type | Emoji | ASCII | Use Case |
|------|-------|-------|----------|
| progress | 🔄 | -> | Ongoing work |
| success | ✅ | OK | Completed successfully |
| error | ❌ | ! | Failed, cannot continue |
| warning | ⚠️ | ? | Issue but continuing |

## Examples

### Long File Processing
```bash
# Start monitor
python monitor_task.py start "video_convert" "progress"

# Convert video (takes 5 minutes)
ffmpeg -i input.mp4 output.mp4

# Stop monitor
python monitor_task.py stop "video_convert" "success" "Conversion complete"
```

### Database Migration
```bash
# Start monitor with 10-second interval
python monitor_task.py start "db_migration" "progress" --interval 10

# Run migration
python migrate_db.py

# Stop monitor
python monitor_task.py stop "db_migration" "success" "Migrated 50,000 records"
```

### API Rate Limiting
```bash
# Start monitor
python monitor_task.py start "api_sync" "progress"

# Make 1000 API calls (takes 10 minutes)
python sync_api.py

# Stop monitor
python monitor_task.py stop "api_sync" "success" "All calls successful"
```

## Monitoring Commands

- `monitor_task.py start <name> <status> [--interval <seconds>]` - Start monitoring
- `monitor_task.py stop <name> <status> <message>` - Stop and send final status
- `monitor_task.py status` - View active monitors
- `monitor_task.py cancel_all` - Cancel all monitors (no final status)

## File Structure

```
task-status/
├── SKILL.md              # Skill metadata and documentation
├── references/
│   └── usage.md          # Detailed usage guide
├── scripts/
│   ├── send_status.py    # Manual status updates
│   └── monitor_task.py   # Automatic periodic monitoring
├── .task_status_state.json  # Active monitor state (generated)
└── README.md             # This file
```

## Integration with Clawdbot

Add to your workspace in `AGENTS.md` or `TOOLS.md`:

```markdown
### Task Status
- Manual updates: `python scripts/send_status.py "message" "type" "step"`
- Auto monitoring: `python monitor_task.py start "task" "progress"`
- Periodic updates: Every 5 seconds automatically
```

## Tips

1. **Short Messages**: Keep status messages under 140 characters
2. **Specific Names**: Use descriptive task names for clarity
3. **Always Stop**: Remember to stop the monitor with final status
4. **Check Status**: Use `monitor_task.py status` to see active monitors
5. **Cleanup**: Use `cancel_all` if monitors get stuck

## Troubleshooting

- **Monitor stuck**: Run `python monitor_task.py cancel_all`
- **No output**: Check if monitor is running with `status` command
- **Encoding issues**: ASCII fallback will be used automatically
- **Task done but monitor still running**: Stop it manually with `stop` command