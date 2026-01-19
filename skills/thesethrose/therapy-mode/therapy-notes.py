#!/usr/bin/env python3
"""
Therapy Mode Session Manager CLI
Manages therapy session notes for Clawdbot

Usage:
    therapy-notes new              - Start a new session
    therapy-notes add <text>       - Add a note entry to current session
    therapy-notes insight <text>   - Record a key insight
    therapy-notes state <state>    - Record user state (hyper/hypo/window)
    therapy-notes update <line> <new>  - Update a specific line in current session
    therapy-notes end              - End session (marks as complete)
    therapy-notes archive <date>   - Soft delete: move session to archived
    therapy-notes restore <date>   - Restore session from archived
    therapy-notes view [date]      - View session notes
    therapy-notes list             - List all sessions (active and archived)
    therapy-notes delete <date>    - Hard delete (permanent)
"""

import os
import sys
import json
import shutil
from datetime import datetime
from pathlib import Path

NOTES_DIR = Path("/Users/sethrose/.clawdbot/workspace/therapy-notes")
ACTIVE_DIR = NOTES_DIR / "active"
ARCHIVED_DIR = NOTES_DIR / "archived"
SESSIONS_FILE = NOTES_DIR / "sessions.json"

def get_session_file(date=None):
    if date is None:
        date = datetime.now().strftime("%Y-%m-%d")
    return ACTIVE_DIR / f"session-{date}.md"

def get_archived_file(date):
    return ARCHIVED_DIR / f"session-{date}.md"

def load_sessions():
    if SESSIONS_FILE.exists():
        with open(SESSIONS_FILE) as f:
            return json.load(f)
    return {}

def save_sessions(sessions):
    with open(SESSIONS_FILE, 'w') as f:
        json.dump(sessions, f, indent=2)

def start_session():
    date = datetime.now().strftime("%Y-%m-%d")
    session_file = get_session_file(date)
    
    if session_file.exists():
        print(f"Session for {date} already exists. Use 'therapy-notes add' to continue.")
        return
    
    header = f"""# Session Notes - {date}

## Case Formulation
- **Precipitating**: 
- **Perpetuating**: 
- **Protective**: 

## Session Turn-by-Turn

"""

    with open(session_file, 'w') as f:
        f.write(header)
    
    sessions = load_sessions()
    sessions[date] = {"file": str(session_file), "status": "active", "created": datetime.now().isoformat()}
    save_sessions(sessions)
    
    print(f"Started new session: {date}")

def add_note(text):
    session_file = get_session_file()
    if not session_file.exists():
        print("No active session. Run 'therapy-notes new' first.")
        return
    
    timestamp = datetime.now().strftime("%H:%M")
    entry = f"\n### {timestamp} - Note\n{text}\n"
    
    with open(session_file, 'a') as f:
        f.write(entry)
    
    print(f"Added note at {timestamp}")

def add_insight(text):
    session_file = get_session_file()
    if not session_file.exists():
        print("No active session. Run 'therapy-notes new' first.")
        return
    
    timestamp = datetime.now().strftime("%H:%M")
    entry = f"\n### {timestamp} - Insight\n{text}\n"
    
    with open(session_file, 'a') as f:
        f.write(entry)
    
    print(f"Recorded insight at {timestamp}")

def set_state(state):
    valid_states = ["hyper", "hypo", "window"]
    if state not in valid_states:
        print(f"Invalid state. Use: {', '.join(valid_states)}")
        return
    
    session_file = get_session_file()
    if not session_file.exists():
        print("No active session. Run 'therapy-notes new' first.")
        return
    
    entry = f"\n### User State: {state.upper()}\n"
    
    with open(session_file, 'a') as f:
        f.write(entry)
    
    print(f"Set user state to {state}")

def update_session(line_num, new_text):
    session_file = get_session_file()
    if not session_file.exists():
        print("No active session. Run 'therapy-notes new' first.")
        return
    
    try:
        with open(session_file, 'r') as f:
            lines = f.readlines()
        
        if line_num < 1 or line_num > len(lines):
            print(f"Line number out of range. File has {len(lines)} lines.")
            return
        
        lines[line_num - 1] = new_text + "\n"
        
        with open(session_file, 'w') as f:
            f.writelines(lines)
        
        print(f"Updated line {line_num}")
    except Exception as e:
        print(f"Error updating session: {e}")

def end_session():
    session_file = get_session_file()
    if not session_file.exists():
        print("No active session to end.")
        return
    
    print(f"Session saved: {session_file}")

def archive_session(date):
    session_file = get_session_file(date)
    archived_file = get_archived_file(date)
    
    if not session_file.exists():
        # Check if already archived
        if archived_file.exists():
            print(f"Session {date} is already archived.")
        else:
            print(f"No session found for {date}.")
        return
    
    shutil.move(session_file, archived_file)
    
    sessions = load_sessions()
    if date in sessions:
        sessions[date]["status"] = "archived"
        sessions[date]["archived"] = datetime.now().isoformat()
        save_sessions(sessions)
    
    print(f"Archived session: {date}")

def restore_session(date):
    archived_file = get_archived_file(date)
    session_file = get_session_file(date)
    
    if not archived_file.exists():
        print(f"No archived session found for {date}.")
        return
    
    shutil.move(archived_file, session_file)
    
    sessions = load_sessions()
    if date in sessions:
        sessions[date]["status"] = "active"
        sessions[date]["restored"] = datetime.now().isoformat()
        save_sessions(sessions)
    
    print(f"Restored session: {date}")

def hard_delete(date):
    session_file = get_session_file(date)
    archived_file = get_archived_file(date)
    
    deleted = False
    if session_file.exists():
        os.remove(session_file)
        deleted = True
        sessions = load_sessions()
        sessions.pop(date, None)
        save_sessions(sessions)
    
    if archived_file.exists():
        os.remove(archived_file)
        deleted = True
        sessions = load_sessions()
        sessions.pop(date, None)
        save_sessions(sessions)
    
    if deleted:
        print(f"Permanently deleted session: {date}")
    else:
        print(f"No session found for {date}")

def view_session(date=None):
    session_file = get_session_file(date)
    if not session_file.exists():
        # Check archived
        archived_file = get_archived_file(date) if date else None
        if date and archived_file and archived_file.exists():
            with open(archived_file) as f:
                print(f.read())
            return
        print(f"No session found for {date or 'today'}")
        return
    
    with open(session_file) as f:
        print(f.read())

def list_sessions():
    sessions = load_sessions()
    
    print("Active Sessions:")
    active_found = False
    for date, info in sorted(sessions.items()):
        if info.get("status") == "active":
            print(f"  {date} - Active")
            active_found = True
    if not active_found:
        print("  (none)")
    
    print("\nArchived Sessions:")
    archived_found = False
    for date, info in sorted(sessions.items()):
        if info.get("status") == "archived":
            print(f"  {date} - Archived")
            archived_found = True
    if not archived_found:
        print("  (none)")

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return
    
    command = sys.argv[1]
    
    if command == "new":
        start_session()
    elif command == "add" and len(sys.argv) > 2:
        add_note(" ".join(sys.argv[2:]))
    elif command == "insight" and len(sys.argv) > 2:
        add_insight(" ".join(sys.argv[2:]))
    elif command == "state" and len(sys.argv) > 2:
        set_state(sys.argv[2])
    elif command == "update" and len(sys.argv) > 3:
        try:
            line_num = int(sys.argv[2])
            new_text = " ".join(sys.argv[3:])
            update_session(line_num, new_text)
        except ValueError:
            print("Invalid line number. Use: therapy-notes update <line_number> <new_text>")
    elif command == "end":
        end_session()
    elif command == "archive" and len(sys.argv) > 2:
        archive_session(sys.argv[2])
    elif command == "restore" and len(sys.argv) > 2:
        restore_session(sys.argv[2])
    elif command == "delete" and len(sys.argv) > 2:
        confirm = input(f"Permanently delete session {sys.argv[2]}? This cannot be undone. (y/N): ")
        if confirm.lower() == "y":
            hard_delete(sys.argv[2])
    elif command == "view":
        date = sys.argv[2] if len(sys.argv) > 2 else None
        view_session(date)
    elif command == "list":
        list_sessions()
    else:
        print(__doc__)

if __name__ == "__main__":
    main()
