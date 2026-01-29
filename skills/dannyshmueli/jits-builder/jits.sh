#!/bin/bash
# JITS Builder - Just-In-Time Software
# Usage: jits.sh <command> [args]

JITS_DIR="/data/clawd/jits-apps"
mkdir -p "$JITS_DIR"

case "$1" in
  list)
    echo "🚀 Running JITS Apps:"
    for f in "$JITS_DIR"/*.pid 2>/dev/null; do
      if [ -f "$f" ]; then
        name=$(basename "$f" .pid)
        pid=$(cat "$f")
        port=$(cat "$JITS_DIR/$name.port" 2>/dev/null || echo "?")
        url=$(cat "$JITS_DIR/$name.url" 2>/dev/null || echo "no tunnel")
        if kill -0 "$pid" 2>/dev/null; then
          echo "  ✅ $name (port $port) - $url"
        else
          echo "  ❌ $name (stopped)"
          rm -f "$f" "$JITS_DIR/$name.port" "$JITS_DIR/$name.url"
        fi
      fi
    done
    ;;
    
  stop)
    name="$2"
    if [ -f "$JITS_DIR/$name.pid" ]; then
      pid=$(cat "$JITS_DIR/$name.pid")
      kill "$pid" 2>/dev/null
      # Also kill tunnel if exists
      tunnel_pid=$(cat "$JITS_DIR/$name.tunnel.pid" 2>/dev/null)
      [ -n "$tunnel_pid" ] && kill "$tunnel_pid" 2>/dev/null
      rm -f "$JITS_DIR/$name".*
      echo "🛑 Stopped $name"
    else
      echo "❌ App '$name' not found"
    fi
    ;;
    
  serve)
    # Internal: serve an HTML file
    name="$2"
    port="$3"
    html_file="$JITS_DIR/$name.html"
    
    if [ ! -f "$html_file" ]; then
      echo "❌ HTML file not found: $html_file"
      exit 1
    fi
    
    # Simple Node.js server
    node -e "
      const http = require('http');
      const fs = require('fs');
      const html = fs.readFileSync('$html_file', 'utf-8');
      http.createServer((req, res) => {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(html);
      }).listen($port, () => console.log('JITS server on port $port'));
    " &
    
    echo $! > "$JITS_DIR/$name.pid"
    echo "$port" > "$JITS_DIR/$name.port"
    echo "✅ Serving $name on port $port"
    ;;
    
  tunnel)
    # Internal: create tunnel for an app
    name="$2"
    port="$3"
    
    /tmp/cloudflared tunnel --url "http://localhost:$port" 2>&1 | while read line; do
      if echo "$line" | grep -q "trycloudflare.com"; then
        url=$(echo "$line" | grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com')
        if [ -n "$url" ]; then
          echo "$url" > "$JITS_DIR/$name.url"
          echo "🌐 Tunnel: $url"
        fi
      fi
    done &
    
    echo $! > "$JITS_DIR/$name.tunnel.pid"
    ;;
    
  *)
    echo "JITS Builder - Just-In-Time Software"
    echo ""
    echo "Usage:"
    echo "  jits.sh list          - List running apps"
    echo "  jits.sh stop <name>   - Stop an app"
    echo ""
    echo "To build a new app, describe what you want to Claude!"
    ;;
esac
