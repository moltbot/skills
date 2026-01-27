#!/usr/bin/env python3
"""Roku daemon - persistent connection, listens on named pipe.

Receives callbacks from Clawdbot direct routing in format:
  roku_<command>  (e.g., roku_play, roku_up, roku_home)

Keeps Roku connection open for instant response.
"""

import os
import sys
import time
import threading

PIPE_PATH = "/tmp/roku-control"
IP = os.environ.get("ROKU_IP", "")

# Map callback names to Roku SDK methods
BUTTON_MAP = {
    "up": "up",
    "down": "down",
    "left": "left",
    "right": "right",
    "ok": "select",
    "back": "back",
    "home": "home",
    "play": "play",
    "pause": "play",  # play/pause toggle
    "rev": "reverse",
    "fwd": "forward",
    "replay": "replay",
    "info": "info",
    "search": "search",
    "mute": "volume_mute",
    "volup": "volume_up",
    "voldown": "volume_down",
}


def main():
    if not IP:
        print("Set ROKU_IP environment variable", file=sys.stderr)
        sys.exit(1)

    from roku import Roku

    r = Roku(IP)

    # Create named pipe
    if os.path.exists(PIPE_PATH):
        os.unlink(PIPE_PATH)
    os.mkfifo(PIPE_PATH)

    print(f"Roku daemon ready: {IP}", flush=True)
    print(f"Listening on: {PIPE_PATH}", flush=True)

    def handle_command(cmd: str):
        """Process a roku_* callback command."""
        cmd = cmd.strip()
        if not cmd.startswith("roku_"):
            return

        action = cmd[5:]  # strip "roku_" prefix

        # Handle app launch: roku_app_12345
        if action.startswith("app_"):
            app_id = action[4:]
            try:
                r.launch(app_id)
                print(f"Launched app: {app_id}", flush=True)
            except Exception as e:
                print(f"Launch failed: {e}", file=sys.stderr)
            return

        # Handle button press
        btn = BUTTON_MAP.get(action)
        if btn and hasattr(r, btn):
            try:
                getattr(r, btn)()
                print(f"Pressed: {action}", flush=True)
            except Exception as e:
                print(f"Button failed: {e}", file=sys.stderr)
        else:
            print(f"Unknown command: {action}", file=sys.stderr)

    def read_pipe():
        """Continuously read from named pipe."""
        while True:
            try:
                with open(PIPE_PATH, "r") as f:
                    for line in f:
                        handle_command(line)
            except Exception as e:
                print(f"Pipe error: {e}", file=sys.stderr)
                time.sleep(0.1)

    thread = threading.Thread(target=read_pipe, daemon=True)
    thread.start()

    # Keep main thread alive
    try:
        while True:
            time.sleep(60)
    except KeyboardInterrupt:
        print("\nShutting down", flush=True)
        if os.path.exists(PIPE_PATH):
            os.unlink(PIPE_PATH)


if __name__ == "__main__":
    main()
