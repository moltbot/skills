#!/bin/bash
# Token Alert Dashboard Starter with CORS Proxy
# Startet CORS Proxy-Server und öffnet Dashboard im Browser

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PORT=8765

# Kill old instances
pkill -f 'proxy-server.py' 2>/dev/null || true
sleep 1

# Start proxy server
echo "🚀 Starte CORS Proxy-Server auf Port $PORT..."
cd "$SCRIPT_DIR"
chmod +x proxy-server.py
python3 proxy-server.py > /tmp/token-alert-proxy.log 2>&1 &
sleep 2

if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "✅ Proxy-Server gestartet!"
else
    echo "❌ Fehler beim Starten des Proxy-Servers"
    echo "📋 Log: /tmp/token-alert-proxy.log"
    exit 1
fi

# Open dashboard
echo "🌐 Öffne Dashboard..."
open "http://localhost:$PORT/dashboard-v3.html"
echo "✅ Dashboard geöffnet!"
echo ""
echo "💡 Zum Stoppen: pkill -f 'proxy-server.py'"
echo "📋 Logs: tail -f /tmp/token-alert-proxy.log"
