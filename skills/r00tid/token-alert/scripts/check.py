#!/usr/bin/env python3
"""
Token Alert Checker v2.0
Monitors Clawdbot session token usage with Material Design progress bars
"""

import sys
import json
import re
import subprocess
from pathlib import Path


def get_session_tokens():
    """
    Get current session token usage from Clawdbot session_status.
    
    Returns:
        dict: {"used": int, "limit": int, "percent": float, "model": str}
    """
    try:
        # Run clawdbot status to get session info
        result = subprocess.run(
            ['clawdbot', 'status'],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode != 0:
            return _fallback_tokens()
        
        output = result.stdout
        
        # Parse Sessions table: "│ agent:main:main │ ... │ claude-sonnet-4-5 │ 172k/1000k (17%) │"
        # Look for main session (not cron)
        session_match = re.search(
            r'agent:main:main.*?│\s+([\w\-\.]+)\s+│\s+(\d+)k/(\d+)k\s+\((\d+)%\)',
            output
        )
        
        if session_match:
            model = session_match.group(1)
            used_k = int(session_match.group(2))
            limit_k = int(session_match.group(3))
            percent = float(session_match.group(4))
            
            # Convert k to actual tokens
            used = used_k * 1000
            limit = limit_k * 1000
            
            return {
                "used": used,
                "limit": limit,
                "percent": percent,
                "model": model
            }
        
        # Fallback: try any session
        any_session = re.search(
            r'│\s+\w+\s+│\s+([\w\-\.]+)\s+│\s+(\d+)k/(\d+)k\s+\((\d+)%\)',
            output
        )
        
        if any_session:
            model = any_session.group(1)
            used_k = int(any_session.group(2))
            limit_k = int(any_session.group(3))
            percent = float(any_session.group(4))
            
            used = used_k * 1000
            limit = limit_k * 1000
            
            return {
                "used": used,
                "limit": limit,
                "percent": percent,
                "model": model
            }
        
        return _fallback_tokens()
        
    except Exception as e:
        print(f"Warning: Could not get session status: {e}", file=sys.stderr)
        return _fallback_tokens()


def _fallback_tokens():
    """Fallback when session_status not available."""
    return {
        "used": 0,
        "limit": 200000,
        "percent": 0.0,
        "model": "claude-sonnet-4-5"
    }


def check_thresholds(percent):
    """
    Check if usage exceeds thresholds.
    
    Args:
        percent (float): Current usage percentage
        
    Returns:
        tuple: (level, emoji, color_emoji) 
    """
    if percent >= 95:
        return "EMERGENCY", "🚨", "🟣"  # Magenta
    elif percent >= 90:
        return "CRITICAL", "🔴", "🔴"  # Red
    elif percent >= 75:
        return "HIGH", "🔶", "🟠"  # Red-Orange
    elif percent >= 50:
        return "MEDIUM", "🟠", "🟠"  # Orange
    elif percent >= 25:
        return "LOW", "🟡", "🟡"  # Yellow
    else:
        return "OK", "🟢", "🟢"  # Green


def create_progress_bar(percent, total_blocks=25):
    """
    Creates Material Design box-style progress bar.
    
    Args:
        percent (float): Current usage percentage
        total_blocks (int): Total number of blocks in bar
        
    Returns:
        str: Formatted progress bar (▰ = filled, ▱ = empty)
    """
    filled = int((percent / 100) * total_blocks)
    empty = total_blocks - filled
    
    level, emoji, color = check_thresholds(percent)
    
    bar = "▰" * filled + "▱" * empty
    return f"{emoji} {bar} {percent:.1f}%"


def estimate_sessions_remaining(remaining_tokens, avg_tokens_per_session=50000):
    """
    Estimate how many sessions are left.
    
    Args:
        remaining_tokens (int): Tokens remaining
        avg_tokens_per_session (int): Average tokens per session
        
    Returns:
        str: Formatted estimate
    """
    sessions = remaining_tokens / avg_tokens_per_session
    
    if sessions >= 3:
        return f"~{int(sessions)} weitere"
    elif sessions >= 1:
        return f"~{int(sessions)} weitere"
    elif sessions >= 0.5:
        return "<1 Session"
    else:
        return "KEINE"


def format_alert(used, limit, percent, level, emoji):
    """
    Format alert message with Material Design progress bar.
    
    Args:
        used (int): Tokens used
        limit (int): Token limit
        percent (float): Usage percentage
        level (str): Alert level
        emoji (str): Status emoji
        
    Returns:
        str: Formatted alert message
    """
    remaining = limit - used
    remaining_k = remaining / 1000
    
    # Create progress bar
    progress_bar = create_progress_bar(percent)
    
    # Session estimate
    sessions_left = estimate_sessions_remaining(remaining)
    
    # Build message based on level
    if level == "OK":
        message = f"{emoji} Token Status\n\n"
        message += f"{progress_bar}\n"
        message += f"{used:,} / {limit:,} Tokens verwendet\n\n"
        message += f"📊 Status: Alles im grünen Bereich!\n"
        message += f"💡 Verbleibend: ~{remaining_k:.0f}k Tokens\n"
        message += f"⏰ Geschätzte Sessions: {sessions_left}\n\n"
        message += f"Tipp: Alles noch im grünen Bereich! 👍"
        
    elif level == "LOW":
        message = f"{emoji} Token Status: Low Warning\n\n"
        message += f"{progress_bar}\n"
        message += f"{used:,} / {limit:,} Tokens verwendet\n\n"
        message += f"📊 Status: Low Warning (Gelbe Zone)\n"
        message += f"💡 Verbleibend: ~{remaining_k:.0f}k Tokens\n"
        message += f"⏰ Geschätzte Sessions: {sessions_left}\n\n"
        message += f"💡 Tipp: Noch genug Luft, aber im Blick behalten!"
        
    elif level == "MEDIUM":
        message = f"{emoji} Token Alert: Achtung!\n\n"
        message += f"{progress_bar}\n"
        message += f"{used:,} / {limit:,} Tokens verwendet\n\n"
        message += f"⚠️ Status: Medium Warning (Orange Zone)\n"
        message += f"💡 Verbleibend: ~{remaining_k:.0f}k Tokens\n"
        message += f"⏰ Geschätzte Sessions: {sessions_left}\n\n"
        message += f"🔧 Empfehlung:\n"
        message += f"   ✅ Token-sparend arbeiten\n"
        message += f"   ✅ Kürzere Antworten bevorzugen"
        
    elif level == "HIGH":
        message = f"{emoji} Token Alert: Achtung!\n\n"
        message += f"{progress_bar}\n"
        message += f"{used:,} / {limit:,} Tokens verwendet\n\n"
        message += f"⚠️ Status: High Warning (Rot-Orange Zone)\n"
        message += f"💡 Verbleibend: ~{remaining_k:.0f}k Tokens\n"
        message += f"⏰ Geschätzte Sessions: {sessions_left}\n\n"
        message += f"🔧 Empfehlung:\n"
        message += f"   ✅ Wichtige Entscheidungen jetzt treffen\n"
        message += f"   ✅ Neue Session vorbereiten\n"
        message += f"   ✅ Token-sparend arbeiten"
        
    elif level == "CRITICAL":
        message = f"{emoji} KRITISCH: Token-Limit fast erreicht!\n\n"
        message += f"{progress_bar}\n"
        message += f"{used:,} / {limit:,} Tokens verwendet\n\n"
        message += f"🚨 Status: CRITICAL (Rote Zone)\n"
        message += f"💡 Verbleibend: ~{remaining_k:.0f}k Tokens\n"
        message += f"⏰ Geschätzte Sessions: {sessions_left}\n\n"
        message += f"🔥 SOFORT HANDELN:\n"
        message += f"   ⚡ Memory sichern (JETZT!)\n"
        message += f"   ⚡ Session zusammenfassen\n"
        message += f"   ⚡ NEUE SESSION STARTEN!"
        
    elif level == "EMERGENCY":
        message = f"{emoji} NOTFALL: Token-Limit erreicht!\n\n"
        message += f"{progress_bar}\n"
        message += f"{used:,} / {limit:,} Tokens verwendet\n\n"
        message += f"💀 Status: EMERGENCY (Magenta Zone)\n"
        message += f"💡 Verbleibend: ~{remaining_k:.0f}k Tokens (2-3 Messages!)\n"
        message += f"⏰ Geschätzte Sessions: {sessions_left}\n\n"
        message += f"🆘 LETZTE WARNUNG:\n"
        message += f"   🔴 Jede weitere Message = Risiko!\n"
        message += f"   🔴 Context wird bald abgeschnitten!\n"
        message += f"   🔴 SOFORT NEUE SESSION STARTEN!!!"
    
    return message


def main():
    """Main entry point"""
    # Get token usage
    stats = get_session_tokens()
    used = stats["used"]
    limit = stats["limit"]
    percent = stats["percent"]
    model = stats.get("model", "claude-sonnet-4-5")
    
    # Check thresholds
    level, emoji, color = check_thresholds(percent)
    
    # Format message
    message = format_alert(used, limit, percent, level, emoji)
    
    # Add model info
    message += f"\n\n📊 Model: {model}"
    
    # Output
    print(message)
    
    # Return exit code based on level
    exit_codes = {
        "OK": 0,
        "LOW": 1,
        "MEDIUM": 2,
        "HIGH": 3,
        "CRITICAL": 4,
        "EMERGENCY": 5
    }
    return exit_codes.get(level, 0)


if __name__ == "__main__":
    sys.exit(main())
