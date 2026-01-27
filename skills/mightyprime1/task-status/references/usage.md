# Task Status Usage Guide

## Quick Examples

### Manual Status Updates (Single Messages)
```bash
# Progress update
python send_status.py "Fetching data..." "progress" "fetch"

# Success update
python send_status.py "Done! 150 records processed" "success" "process"

# Error update
python send_status.py "Failed to connect to API" "error" "api_call"

# Warning update
python send_status.py "Continuing despite timeout" "warning" "timeout"
```

### Automated Periodic Monitoring (Every 5 seconds)
```bash
# Start monitoring a long task
python monitor_task.py start "video_processing" "progress"

# Monitor runs in background, sending "Still working..." updates every 5 seconds

# Stop monitoring with final status
python monitor_task.py stop "video_processing" "success" "Processing complete!"

# Or with an error
python monitor_task.py stop "video_processing" "error" "Failed: Corrupt file"
```

### Python Script
```python
from send_status import send_status

def process_data():
    send_status("Reading files...", "progress", "read")
    # ... work
    send_status("Processing complete", "success", "process")
```

### Shell Script
```bash
#!/bin/bash
python send_status.py "Starting backup..." "progress" "backup"
# ... backup command
python send_status.py "Backup complete" "success" "backup"
```

## Status Types

| Type | Emoji | ASCII | When to Use |
|------|-------|-------|-------------|
| progress | 🔄 | -> | Ongoing work, "still working on it" |
| success | ✅ | OK | Task completed successfully |
| error | ❌ | ! | Task failed, cannot continue |
| warning | ⚠️ | ? | Issue but continuing |

## When to Use Each Method

### Use Manual Updates When:
- Task is short (under 30 seconds)
- You want control over when updates are sent
- Task has discrete, meaningful milestones

### Use Periodic Monitoring When:
- Task is long-running (over 1 minute)
- You want consistent "heartbeat" updates every 5 seconds
- Task has long periods of quiet work
- You want to reassure user that work is ongoing

## Periodic Monitoring Details

### Starting a Monitor
```bash
python monitor_task.py start "<task_name>" "<status_type>" [--interval <seconds>]
```

- Sends "Still working..." updates every 5 seconds by default
- Runs in background until stopped
- Can customize interval with `--interval`

### Viewing Active Monitors
```bash
python monitor_task.py status
```

### Cancelling All Monitors (Without Final Status)
```bash
python monitor_task.py cancel_all
```

## Best Practices

1. **Keep messages short** - Under 140 characters
2. **Be specific** - Include step names for clarity
3. **Update periodically** - Every ~4 seconds for long tasks (or use monitoring)
4. **Use details** - Add extra context when needed
5. **End with status** - Always send final success/error

## Common Patterns

### Multi-step Task (Manual)
```bash
python send_status.py "Step 1/5: Validating input" "progress" "step1"
# ... step 1
python send_status.py "Step 2/5: Processing data" "progress" "step2"
# ... step 2
# ... etc
python send_status.py "All steps complete" "success" "final"
```

### Long-Running Task (Automatic Monitoring)
```bash
# Start monitor before starting the task
python monitor_task.py start "data_migration" "progress"

# Run the actual task (can take minutes/hours)
# Monitor sends "Still working..." updates every 5 seconds

# When task finishes, stop monitor with final status
python monitor_task.py stop "data_migration" "success" "Migration complete: 5000 records"
```

### With Details
```bash
python send_status.py "Uploading..." "progress" "upload" --details "File: report.pdf (2.4MB)"
```

### Error Recovery
```bash
python send_status.py "Connection failed, retrying..." "warning" "retry"
# ... retry logic
if success:
    python send_status.py "Retry successful" "success" "retry"
else:
    python send_status.py "Retry failed, giving up" "error" "retry"
```

### Long Task with Manual Control
```bash
# Start monitor
python monitor_task.py start "processing" "progress"

# ... do work ...

# Check status periodically
python monitor_task.py status

# When done, stop monitor
python monitor_task.py stop "processing" "success" "Finished!"
```

## Integration

### Import send_status for Python Scripts
```python
from send_status import send_status

msg = send_status("Working...", "progress", "work")
print(f"Logged: {msg}")  # Output: "-> [work] Working..."
```

### Use in Shell Scripts
```bash
#!/bin/bash
send_status() {
    python send_status.py "$1" "$2" "$3"
}

send_status "Starting process" "progress" "main"
# ... process
send_status "Done" "success" "main"
```

### Automation with Clawdbot Cron
For scheduled tasks that need periodic status updates, use Clawdbot's cron feature.

## Monitoring Use Cases

### File Processing
```bash
python monitor_task.py start "file_proc" "progress"
# Process 1000 files (takes 10 minutes)
python monitor_task.py stop "file_proc" "success" "Processed 1000 files"
```

### Data Sync
```bash
python monitor_task.py start "sync" "progress" --interval 10
# Sync databases (takes 5 minutes)
python monitor_task.py stop "sync" "success" "Sync complete"
```

### API Calls
```bash
python monitor_task.py start "api_call" "progress"
# Make 1000 API requests
python monitor_task.py stop "api_call" "success" "All 1000 requests successful"
```