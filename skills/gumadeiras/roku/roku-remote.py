#!/usr/bin/env python3
"""Send Roku remote keyboard to Telegram.

Usage:
    roku-remote.py          # Outputs JSON for Clawdbot message tool

The buttons use callback_data in format "roku_<action>" which
Clawdbot direct routing writes to /tmp/roku-control for the daemon.
"""

import json


def main():
    """Output remote keyboard JSON for Clawdbot message tool."""
    buttons = [
        [
            {"text": "🔇", "callback_data": "roku_mute"},
            {"text": "↑", "callback_data": "roku_up"},
            {"text": "🏠", "callback_data": "roku_home"},
        ],
        [
            {"text": "←", "callback_data": "roku_left"},
            {"text": "OK", "callback_data": "roku_ok"},
            {"text": "→", "callback_data": "roku_right"},
        ],
        [
            {"text": "⬅️", "callback_data": "roku_back"},
            {"text": "↓", "callback_data": "roku_down"},
            {"text": "ℹ️", "callback_data": "roku_info"},
        ],
        [
            {"text": "⏪", "callback_data": "roku_rev"},
            {"text": "⏯️", "callback_data": "roku_play"},
            {"text": "⏩", "callback_data": "roku_fwd"},
        ],
        [
            {"text": "🔈-", "callback_data": "roku_voldown"},
            {"text": "🔊+", "callback_data": "roku_volup"},
            {"text": "🔍", "callback_data": "roku_search"},
        ],
    ]

    msg = {
        "action": "send",
        "channel": "telegram",
        "message": "📺 Roku Remote",
        "buttons": buttons,
    }
    print(json.dumps(msg))


if __name__ == "__main__":
    main()
