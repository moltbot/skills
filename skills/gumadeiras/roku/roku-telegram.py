#!/usr/bin/env python3
"""Roku Telegram poller - receives button presses directly."""

import os
import sys
import time
import json
import requests

TOKEN = os.environ.get("TELEGRAM_TOKEN", "")
PIPE_PATH = "/tmp/roku-control"
POLL_INTERVAL = 0.5

if not TOKEN:
    print("Set TELEGRAM_TOKEN")
    sys.exit(1)

if not os.path.exists(PIPE_PATH):
    print("Roku daemon not running")
    sys.exit(1)

def send_to_roku(btn):
    with open(PIPE_PATH, 'w') as f:
        f.write(f"btn {btn}\n")

def main():
    offset = None
    print("Polling started", flush=True)
    
    while True:
        try:
            url = f"https://api.telegram.org/bot{TOKEN}/getUpdates"
            params = {"offset": offset, "timeout": 10} if offset else {"timeout": 10}
            
            resp = requests.get(url, params=params, timeout=15)
            data = resp.json()
            
            if data.get("ok"):
                for update in data["result"]:
                    offset = update["update_id"] + 1
                    
                    if "callback_query" in update:
                        cb = update["callback_query"]["data"]
                        if cb.startswith("roku_"):
                            btn = cb.replace("roku_", "")
                            print(f"→ {btn}", flush=True)
                            send_to_roku(btn)
                            
                            # Answer callback
                            cb_id = update["callback_query"]["id"]
                            requests.post(
                                f"https://api.telegram.org/bot{TOKEN}/answerCallbackQuery",
                                json={"callback_query_id": cb_id}
                            )
                            
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            time.sleep(1)
        
        time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    main()
