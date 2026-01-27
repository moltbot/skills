#!/usr/bin/env python3
"""
Monitor a long-running task and send periodic status updates every 5 seconds.

Usage:
    # Start monitoring
    python monitor_task.py start "<task_name>" "<status_type>" [--interval <seconds>]
    
    # Stop monitoring (sends final status)
    python monitor_task.py stop "<task_name>" "<final_status>" "<final_message>"

Status Types (for final status):
    progress - Ongoing work (shows 🔄)
    success  - Task complete (shows ✅)
    error    - Failed task (shows ❌)
    warning  - Issue but continuing (shows ⚠️)

Examples:
    # Start monitoring a video processing task
    python monitor_task.py start "video_proc" "progress"
    
    # Later, stop with success
    python monitor_task.py stop "video_proc" "success" "Processing complete!"
    
    # Or with an error
    python monitor_task.py stop "video_proc" "error" "Failed: Corrupt file"
"""

import sys
sys.stdout.reconfigure(encoding='utf-8')

import time
import json
import threading
from pathlib import Path
from datetime import datetime
from send_status import send_status, can_encode_emoji

# State file to track active monitors
# Path: C:\Users\Luffy\clawd\task-status\scripts\monitor_task.py
# Parent: C:\Users\Luffy\clawd\task-status\scripts
# Parent.parent: C:\Users\Luffy\clawd\task-status
STATE_FILE = Path(__file__).parent.parent / ".task_status_state.json"

def load_state():
    """Load active monitors from state file."""
    if STATE_FILE.exists():
        try:
            with open(STATE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    return {}

def save_state(state):
    """Save active monitors to state file."""
    with open(STATE_FILE, 'w', encoding='utf-8') as f:
        json.dump(state, f, indent=2)

def monitor_worker(task_name: str, interval: int = 5):
    """
    Background worker that sends periodic updates.
    Runs until stopped via state file check.
    """
    import sys
    sys.stdout.reconfigure(encoding='utf-8')
    
    print(f"[DEBUG] monitor_worker started for '{task_name}' with {interval}s interval", file=sys.stderr)
    sys.stderr.flush()
    
    last_update = time.time()
    print(f"[DEBUG] Initial last_update: {last_update}", file=sys.stderr)
    sys.stderr.flush()
    
    iteration = 0
    while True:
        iteration += 1
        
        # Check if task still exists in state
        state = load_state()
        print(f"[DEBUG] Iteration {iteration}: State keys = {list(state.keys())}", file=sys.stderr)
        sys.stderr.flush()
        
        print(f"[DEBUG] Checking if '{task_name}' in state: {task_name in state}", file=sys.stderr)
        sys.stderr.flush()
        
        if task_name not in state:
            print(f"[DEBUG] Task '{task_name}' not in state, stopping worker", file=sys.stderr)
            sys.stderr.flush()
            # Task was stopped
            break
        
        # Send "Still working..." update if enough time has passed
        current_time = time.time()
        elapsed = current_time - last_update
        print(f"[DEBUG] Iteration {iteration}: elapsed={elapsed:.1f}s, interval={interval}s", file=sys.stderr)
        sys.stderr.flush()
        
        if elapsed >= interval:
            print(f"[DEBUG] Time to send update! elapsed={elapsed:.1f}s >= interval={interval}s", file=sys.stderr)
            sys.stderr.flush()
            
            # Send progress update
            message = f"Still working..."
            status = "progress"
            
            # Try to send status
            try:
                print(f"[DEBUG] Sending status: {message} {status} {task_name}", file=sys.stderr)
                sys.stderr.flush()
                send_status(message, status, task_name)
                print(f"[DEBUG] Status sent successfully", file=sys.stderr)
                sys.stderr.flush()
            except Exception as e:
                # If send fails, log but continue
                print(f"[DEBUG] Monitor warning: {e}", file=sys.stderr)
                sys.stderr.flush()
            
            last_update = current_time
            print(f"[DEBUG] Updated last_update: {last_update}", file=sys.stderr)
            sys.stderr.flush()
        else:
            print(f"[DEBUG] Not time yet, sleeping...", file=sys.stderr)
            sys.stderr.flush()
        
        # Sleep briefly to avoid tight loop (reduced from 0.5 to 0.1)
        time.sleep(0.1)
    
    print(f"[DEBUG] monitor_worker finished", file=sys.stderr)
    sys.stderr.flush()

def start_monitor(task_name: str, status_type: str = "progress", interval: int = 5):
    """
    Start a new monitor for the given task.
    """
    import sys
    sys.stdout.reconfigure(encoding='utf-8')
    
    print(f"[DEBUG] start_monitor called: task_name='{task_name}', status_type='{status_type}', interval={interval}", file=sys.stderr)
    
    # Validate status type
    if status_type not in ["progress", "success", "error", "warning"]:
        print(f"Invalid status type: {status_type}", file=sys.stderr)
        sys.exit(1)
    
    # Check if already monitoring
    state = load_state()
    print(f"[DEBUG] Current state: {state}", file=sys.stderr)
    
    if task_name in state:
        print(f"Already monitoring task '{task_name}'", file=sys.stderr)
        sys.exit(1)
    
    # Add to state
    state[task_name] = {
        "status_type": status_type,
        "interval": interval,
        "started_at": datetime.now().isoformat()
    }
    print(f"[DEBUG] Saving new state: {state}", file=sys.stderr)
    save_state(state)
    
    # Send initial status
    print(f"[DEBUG] Sending initial status", file=sys.stderr)
    send_status(f"Monitoring started (updates every {interval}s)", status_type, task_name)
    
    # Start background monitor thread
    print(f"[DEBUG] Starting monitor thread", file=sys.stderr)
    thread = threading.Thread(
        target=monitor_worker,
        args=(task_name, interval),
        daemon=True
    )
    thread.start()
    print(f"[DEBUG] Monitor thread started: {thread}", file=sys.stderr)
    
    print(f"Monitor started for '{task_name}' with {interval}s interval")

def stop_monitor(task_name: str, final_status: str, final_message: str):
    """
    Stop monitoring and send final status.
    """
    import sys
    sys.stdout.reconfigure(encoding='utf-8')
    
    print(f"[DEBUG] stop_monitor called: task_name='{task_name}', final_status='{final_status}', final_message='{final_message}'", file=sys.stderr)
    
    # Check if monitoring
    state = load_state()
    print(f"[DEBUG] Current state: {state}", file=sys.stderr)
    
    if task_name not in state:
        print(f"No active monitor for task '{task_name}'", file=sys.stderr)
        sys.exit(1)
    
    # Remove from state
    print(f"[DEBUG] Removing '{task_name}' from state", file=sys.stderr)
    del state[task_name]
    print(f"[DEBUG] New state: {state}", file=sys.stderr)
    save_state(state)
    
    # Send final status
    print(f"[DEBUG] Sending final status", file=sys.stderr)
    send_status(final_message, final_status, task_name)
    
    print(f"Monitor stopped for '{task_name}'")
    print(f"Final status: {final_message}")

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    action = sys.argv[1].lower()
    
    if action == "start":
        if len(sys.argv) < 4:
            print("Usage: monitor_task.py start <task_name> <status_type> [--interval <seconds>]", file=sys.stderr)
            sys.exit(1)
        
        task_name = sys.argv[2]
        status_type = sys.argv[3]
        interval = 5
        
        # Check for --interval flag
        if len(sys.argv) > 5 and sys.argv[4] == "--interval":
            try:
                interval = int(sys.argv[5])
            except ValueError:
                print("Interval must be an integer", file=sys.stderr)
                sys.exit(1)
        
        start_monitor(task_name, status_type, interval)
    
    elif action == "stop":
        if len(sys.argv) < 5:
            print("Usage: monitor_task.py stop <task_name> <final_status> <final_message>", file=sys.stderr)
            sys.exit(1)
        
        task_name = sys.argv[2]
        final_status = sys.argv[3]
        final_message = sys.argv[4]
        
        stop_monitor(task_name, final_status, final_message)
    
    elif action == "status":
        # Show active monitors
        state = load_state()
        if not state:
            print("No active monitors")
        else:
            print("Active monitors:")
            for task, info in state.items():
                print(f"  {task}: {info['status_type']} (interval: {info['interval']}s)")
    
    elif action == "cancel_all":
        # Stop all monitors without sending final status
        state = load_state()
        if state:
            for task_name in list(state.keys()):
                del state[task_name]
            save_state(state)
            print(f"Cancelled all monitors: {list(state.keys())}")
        else:
            print("No active monitors to cancel")
    
    else:
        print(f"Unknown action: {action}", file=sys.stderr)
        print(__doc__)
        sys.exit(1)

if __name__ == "__main__":
    main()
