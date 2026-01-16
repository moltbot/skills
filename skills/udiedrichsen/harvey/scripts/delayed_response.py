#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = []
# ///

"""
Harvey Delayed Response - Schedules delayed messages for restaurant mode.
Uses a simple file-based queue that Clawdbot can check.
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path
import random

# Queue file location
STATE_DIR = Path(__file__).parent.parent / "state"
QUEUE_FILE = STATE_DIR / "response_queue.json"

def load_queue() -> list:
    """Load pending responses queue."""
    if not QUEUE_FILE.exists():
        return []
    try:
        with open(QUEUE_FILE) as f:
            return json.load(f)
    except (json.JSONDecodeError, KeyError):
        return []

def save_queue(queue: list) -> None:
    """Save response queue."""
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    with open(QUEUE_FILE, "w") as f:
        json.dump(queue, f, indent=2, default=str)

def schedule_response(message: str, delay_seconds: int = None, mode: str = "restaurant") -> dict:
    """
    Schedule a delayed response.
    
    For restaurant mode: random delay 30-90 seconds
    For other modes: immediate or custom delay
    """
    if delay_seconds is None:
        if mode == "restaurant":
            delay_seconds = random.randint(30, 90)
        else:
            delay_seconds = 0
    
    now = datetime.now(timezone.utc)
    send_at = now + timedelta(seconds=delay_seconds)
    
    entry = {
        "id": f"harvey_{now.timestamp()}",
        "message": message,
        "scheduled_at": now.isoformat(),
        "send_at": send_at.isoformat(),
        "delay_seconds": delay_seconds,
        "mode": mode,
        "sent": False
    }
    
    queue = load_queue()
    queue.append(entry)
    save_queue(queue)
    
    return entry

def get_pending() -> list:
    """Get all pending (unsent) responses that are due."""
    queue = load_queue()
    now = datetime.now(timezone.utc)
    
    pending = []
    for entry in queue:
        if entry.get("sent"):
            continue
        send_at = datetime.fromisoformat(entry["send_at"])
        if send_at <= now:
            pending.append(entry)
    
    return pending

def mark_sent(entry_id: str) -> bool:
    """Mark a response as sent."""
    queue = load_queue()
    for entry in queue:
        if entry.get("id") == entry_id:
            entry["sent"] = True
            entry["sent_at"] = datetime.now(timezone.utc).isoformat()
            save_queue(queue)
            return True
    return False

def clear_old(hours: int = 24) -> int:
    """Clear entries older than X hours."""
    queue = load_queue()
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=hours)
    
    new_queue = []
    removed = 0
    for entry in queue:
        scheduled = datetime.fromisoformat(entry["scheduled_at"])
        if scheduled > cutoff:
            new_queue.append(entry)
        else:
            removed += 1
    
    save_queue(new_queue)
    return removed

def get_queue_status() -> dict:
    """Get queue statistics."""
    queue = load_queue()
    now = datetime.now(timezone.utc)
    
    pending = [e for e in queue if not e.get("sent")]
    due = []
    for e in pending:
        send_at = datetime.fromisoformat(e["send_at"])
        if send_at <= now:
            due.append(e)
    
    return {
        "total": len(queue),
        "pending": len(pending),
        "due_now": len(due),
        "sent": len([e for e in queue if e.get("sent")])
    }

def main():
    parser = argparse.ArgumentParser(description="Harvey Delayed Response Queue")
    parser.add_argument("action", choices=["schedule", "pending", "sent", "status", "clear"],
                        help="Action to perform")
    parser.add_argument("--message", "-m", help="Message to schedule")
    parser.add_argument("--delay", "-d", type=int, help="Delay in seconds")
    parser.add_argument("--mode", default="restaurant", help="Response mode")
    parser.add_argument("--id", help="Entry ID to mark as sent")
    parser.add_argument("--hours", type=int, default=24, help="Hours for clear action")
    parser.add_argument("--json", "-j", action="store_true", help="Output as JSON")
    
    args = parser.parse_args()
    
    if args.action == "schedule":
        if not args.message:
            print("Error: --message required for schedule", file=sys.stderr)
            sys.exit(1)
        result = schedule_response(args.message, args.delay, args.mode)
        if args.json:
            print(json.dumps(result, indent=2))
        else:
            print(f"⏰ Scheduled in {result['delay_seconds']}s: {result['message'][:50]}...")
            
    elif args.action == "pending":
        pending = get_pending()
        if args.json:
            print(json.dumps(pending, indent=2))
        else:
            if pending:
                print(f"📬 {len(pending)} message(s) ready to send:")
                for p in pending:
                    print(f"  [{p['id']}] {p['message'][:50]}...")
            else:
                print("📭 No pending messages")
                
    elif args.action == "sent":
        if not args.id:
            print("Error: --id required for sent action", file=sys.stderr)
            sys.exit(1)
        if mark_sent(args.id):
            print(f"✅ Marked {args.id} as sent")
        else:
            print(f"❌ Entry {args.id} not found")
            
    elif args.action == "status":
        status = get_queue_status()
        if args.json:
            print(json.dumps(status, indent=2))
        else:
            print(f"📊 Queue: {status['total']} total | {status['pending']} pending | {status['due_now']} due | {status['sent']} sent")
            
    elif args.action == "clear":
        removed = clear_old(args.hours)
        print(f"🧹 Cleared {removed} old entries")

if __name__ == "__main__":
    main()
