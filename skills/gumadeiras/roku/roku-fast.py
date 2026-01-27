#!/usr/bin/env python3
"""Ultra-fast Roku control - no output."""

import os
import sys

IP = os.environ.get("ROKU_IP", "")

btn_map = {
    "roku_up": "up",
    "roku_down": "down", 
    "roku_left": "left",
    "roku_right": "right",
    "roku_select": "select",
    "roku_home": "home",
    "roku_back": "back",
    "roku_info": "info",
    "roku_play": "play",
    "roku_replay": "replay",
    "roku_forward": "forward",
    "roku_reverse": "reverse",
    "roku_power": "power",
}

def main():
    cb = sys.argv[1] if len(sys.argv) > 1 else ""
    if not cb or cb not in btn_map:
        return
    
    from roku import Roku
    r = Roku(IP)
    getattr(r, btn_map[cb])()

if __name__ == "__main__":
    main()
