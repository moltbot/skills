#!/usr/bin/env python3
"""
Send status messages using Clawdbot WebSocket API (fast).
"""

import sys
sys.stdout.reconfigure(encoding='utf-8')

import os
import json
import websocket

# Status type to emoji mapping
STATUS_EMOJIS = {
    "progress": "🔄",
    "success": "✅",
    "error": "❌",
    "warning": "⚠️"
}

def send_status(message: str, status_type: str, step_name: str, details: str = None):
    """
    Format and send a status message to Telegram via WebSocket.
    
    Args:
        message: Short status message (< 140 chars)
        status_type: Type of status (progress, success, error, warning)
        step_name: Name of the step being reported
        details: Optional additional context
    """
    if status_type not in STATUS_EMOJIS:
        raise ValueError(f"Invalid status_type: {status_type}")
    
    emoji = STATUS_EMOJIS[status_type]
    
    # Build the message
    formatted = f"{emoji} [{step_name}] {message}"
    
    if details:
        formatted += f" ({details})"
    
    # Keep it concise (under 140 chars)
    if len(formatted) > 140:
        formatted = formatted[:137] + "..."
    
    # Send via WebSocket
    gateway_port = os.environ.get("CLAWDBOT_GATEWAY_PORT", "18789")
    gateway_token = os.environ.get("CLAWDBOT_GATEWAY_TOKEN")
    target = os.environ.get("TELEGRAM_TARGET", "7590912486")
    
    if not gateway_token:
        print(f"✗ CLAWDBOT_GATEWAY_TOKEN not found", file=sys.stderr)
        return formatted
    
    ws_url = f"ws://127.0.0.1:{gateway_port}/ws"
    
    try:
        # Connect and send
        ws = websocket.create_connection(ws_url, timeout=10)
        
        # Handshake
        handshake = {"type": "handshake", "token": gateway_token}
        ws.send(json.dumps(handshake))
        
        # Send message
        msg = {
            "type": "message",
            "action": "send",
            "target": target,
            "message": formatted,
            "channel": "telegram"
        }
        ws.send(json.dumps(msg))
        
        # Get response
        response = ws.recv()
        result = json.loads(response)
        
        ws.close()
        
        # Check if message was sent
        if result.get("event") == "message.sent" or result.get("type") == "ack":
            return formatted
        else:
            print(f"⚠️  Response: {result}", file=sys.stderr)
            return formatted
            
    except Exception as e:
        print(f"✗ WebSocket error: {e}", file=sys.stderr)
        # Fallback: print to console
        print(formatted, file=sys.stderr)
        return formatted

def main():
    if len(sys.argv) < 4:
        print("Usage: send_status_websocket.py <message> <status_type> <step_name>")
        print("\nStatus Types: progress, success, error, warning")
        sys.exit(1)
    
    message = sys.argv[1]
    status_type = sys.argv[2]
    step_name = sys.argv[3]
    details = sys.argv[4] if len(sys.argv) > 4 else None
    
    try:
        result = send_status(message, status_type, step_name, details)
        print(f"✓ Status sent: {result}")
    except Exception as e:
        print(f"✗ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
