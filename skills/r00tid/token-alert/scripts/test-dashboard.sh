#!/bin/bash
# Test Dashboard - Open in browser

PORT=8765
URL="http://localhost:$PORT/dashboard-v3.html"

# Kill existing test server
pkill -f "python.*$PORT" 2>/dev/null

# Start simple HTTP server
echo "🚀 Starting test server on port $PORT..."
python3 -m http.server $PORT &
SERVER_PID=$!

# Wait for server to start
sleep 1

# Open in default browser
echo "🌐 Opening dashboard: $URL"
open "$URL"

echo ""
echo "📊 Dashboard Test Server Running"
echo "   URL: $URL"
echo "   PID: $SERVER_PID"
echo ""
echo "🔍 Testing checklist:"
echo "   [ ] PWA manifest loads"
echo "   [ ] Service worker registers"
echo "   [ ] Chart.js loads and renders"
echo "   [ ] Theme switcher works"
echo "   [ ] Custom theme editor works"
echo "   [ ] Keyboard shortcuts (press ?)"
echo "   [ ] Cost tracking displays"
echo "   [ ] Token prediction shows"
echo ""
echo "⏹️  Press Ctrl+C to stop server"

# Wait for Ctrl+C
trap "kill $SERVER_PID 2>/dev/null; echo ''; echo '✅ Test server stopped'; exit 0" INT
wait $SERVER_PID
