#!/usr/bin/env python3
"""Fast Roku client - talks to daemon via socket."""

import os
import sys
import socket

SOCKET_PATH = "/tmp/roku-daemon.sock"

def send_cmd(cmd):
    """Send command to daemon and get response."""
    if not os.path.exists(SOCKET_PATH):
        return None
    
    try:
        client = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        client.connect(SOCKET_PATH)
        client.sendall(cmd.encode())
        resp = client.recv(4096)
        client.close()
        return resp
    except:
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: roku-client btn NAME|apps")
        sys.exit(1)
    
    if sys.argv[1] == "btn" and len(sys.argv) > 2:
        send_cmd(f"btn {sys.argv[2]}")
    elif sys.argv[1] == "apps":
        resp = send_cmd("apps")
        if resp:
            print(resp.decode())
