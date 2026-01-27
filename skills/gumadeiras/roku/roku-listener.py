#!/usr/bin/env python3
"""Generic callback listener - reads from pipe and routes to appropriate handler."""

import os
import sys
import time
import threading

PIPE_PATH = "/tmp/roku-control"
ROKU_IP = os.environ.get("ROKU_IP", "")

def main():
    if not os.path.exists(PIPE_PATH):
        print(f"Pipe not found: {PIPE_PATH}", file=sys.stderr)
        sys.exit(1)
    
    from roku import Roku
    r = Roku(ROKU_IP) if ROKU_IP else None
    
    if not r:
        devices = Roku.discover(timeout=5)
        if devices:
            r = devices[0]
            print(f"Discovered: {r.host}", flush=True)
        else:
            print("No Roku found", file=sys.stderr)
            sys.exit(1)
    
    print(f"Listening: {r.host}", flush=True)
    
    def read_pipe():
        while True:
            try:
                with open(PIPE_PATH, 'r') as f:
                    for line in f:
                        line = line.strip()
                        if not line:
                            continue
                        
                        # Handle roku_* callbacks
                        if line.startswith("roku_"):
                            btn = line.replace("roku_", "")
                            if hasattr(r, btn):
                                getattr(r, btn)()
                                print(f"→ {btn}", flush=True)
                        # Handle "btn NAME" format
                        elif line.startswith("btn "):
                            btn = line.split(" ", 1)[1]
                            if hasattr(r, btn):
                                getattr(r, btn)()
                                print(f"→ {btn}", flush=True)
            except:
                time.sleep(0.01)
    
    thread = threading.Thread(target=read_pipe, daemon=True)
    thread.start()
    
    while True:
        time.sleep(60)

if __name__ == "__main__":
    main()
