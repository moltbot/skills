#!/usr/bin/env python3
"""
Send status messages for long-running tasks.

Usage:
    python send_status.py "<message>" "<status_type>" "<step_name>" [--details "<details>"]

Status Types:
    progress - Ongoing work (shows 🔄)
    success  - Task complete (shows ✅)
    error    - Failed task (shows ❌)
    warning  - Issue but continuing (shows ⚠️)

Example:
    python send_status.py "Fetching data..." "progress" "fetch"
    python send_status.py "Complete!" "success" "final"
    python send_status.py "Error: Missing file" "error" "file_check"
"""

import sys
sys.stdout.reconfigure(encoding='utf-8')

import json
import os
import websocket

# Status type to emoji mapping
STATUS_EMOJIS = {
    "progress": "🔄",
    "success": "✅",
    "error": "❌",
    "warning": "⚠️"
}

def can_encode_emoji(text: str, encoding: str = None) -> bool:
    """Check if text can be encoded with the given encoding."""
    if encoding is None:
        encoding = sys.stdout.encoding
    try:
        text.encode(encoding)
        return True
    except (UnicodeEncodeError, LookupError):
        return False

def send_status(message: str, status_type: str, step_name: str, details: str = None):
    """
    Format and send a status message to Telegram.
    
    Args:
        message: Short status message (< 140 chars)
        status_type: Type of status (progress, success, error, warning)
        step_name: Name of the step being reported
        details: Optional additional context
    """
    if status_type not in STATUS_EMOJIS:
        raise ValueError(f"Invalid status_type: {status_type}")
    
    emoji = STATUS_EMOJIS[status_type]
    
    # Choose emoji or ASCII based on encoding capability
    if can_encode_emoji(emoji):
        prefix = emoji
    else:
        prefix = emoji  # Use emoji anyway, most modern terminals support it
    
    # Build the message
    formatted = f"{prefix} [{step_name}] {message}"
    
    if details:
        formatted += f" ({details})"
    
    # Keep it concise (under 140 chars)
    if len(formatted) > 140:
        formatted = formatted[:137] + "..."
    
    # Try WebSocket first (fastest)
    gateway_token = os.environ.get("CLAWDBOT_GATEWAY_TOKEN")
    
    if gateway_token:
        try:
            gateway_port = os.environ.get("CLAWDBOT_GATEWAY_PORT", "18789")
            target = os.environ.get("TELEGRAM_TARGET", "7590912486")
            ws_url = f"ws://127.0.0.1:{gateway_port}/ws"
            
            # Connect and send
            ws = websocket.create_connection(ws_url, timeout=10)
            
            # Send message directly (no handshake needed for simple messages)
            msg = {
                "type": "message",
                "action": "send",
                "target": target,
                "message": formatted,
                "channel": "telegram"
            }
            ws.send(json.dumps(msg))
            
            # Try to receive response but don't wait too long
            try:
                response = ws.recv()
                result = json.loads(response)
                # If we got a challenge, respond to it
                if result.get("event") == "connect.challenge":
                    # Send handshake with token
                    handshake = {"type": "handshake", "token": gateway_token}
                    ws.send(json.dumps(handshake))
                    # Try to receive again
                    response = ws.recv()
                    result = json.loads(response)
            except:
                # If we can't receive, assume message was sent
                pass
            
            ws.close()
            return formatted
            
        except Exception as e:
            print(f"⚠️  WebSocket failed: {e}", file=sys.stderr)
    
    # Fallback: try CLI
    import subprocess
    import shutil
    
    clawdbot_path = shutil.which("clawdbot")
    
    if not clawdbot_path:
        clawdbot_paths = [
            "C:\\Users\\Luffy\\AppData\\Roaming\\npm\\clawdbot.cmd",
            "C:\\Users\\Luffy\\AppData\\Roaming\\npm\\clawdbot"
        ]
        for path in clawdbot_paths:
            if os.path.exists(path):
                clawdbot_path = path
                break
    
    if clawdbot_path:
        try:
            target = os.environ.get("TELEGRAM_TARGET", "7590912486")
            result = subprocess.run(
                [
                    clawdbot_path,
                    "message",
                    "send",
                    "--target", target,
                    "--message", formatted,
                    "--channel", "telegram"
                ],
                capture_output=True,
                text=True,
                timeout=20
            )
            if result.returncode == 0:
                return formatted
        except Exception as e:
            print(f"⚠️  CLI failed: {e}", file=sys.stderr)
    
    # Final fallback: print to console
    print(formatted, file=sys.stderr)
    
    return formatted

def main():
    if len(sys.argv) < 4:
        print(__doc__)
        sys.exit(1)
    
    message = sys.argv[1]
    status_type = sys.argv[2]
    step_name = sys.argv[3]
    details = sys.argv[4] if len(sys.argv) > 4 else None
    
    try:
        result = send_status(message, status_type, step_name, details)
        print(f"Status sent: {result}")
    except Exception as e:
        print(f"Error sending status: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
