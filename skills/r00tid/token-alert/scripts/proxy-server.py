#!/usr/bin/env python3
"""CORS Proxy Server for Token Alert Dashboard"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import urllib.request
import urllib.parse
import json
import sys

GATEWAY_URL = 'http://localhost:18789'
GATEWAY_TOKEN = 'd91a7a91e0d6bda8b6e3182467fda1f0bebd34c830263a4f'

class ProxyHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        SimpleHTTPRequestHandler.end_headers(self)
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
    
    def do_POST(self):
        # Proxy /api/* requests to Gateway
        if self.path.startswith('/api/'):
            gateway_path = self.path.replace('/api', '', 1)
            self.proxy_to_gateway(gateway_path)
        else:
            self.send_error(404, 'Not found')
    
    def proxy_to_gateway(self, path):
        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length) if content_length > 0 else b''
            
            # Forward to Gateway
            url = f'{GATEWAY_URL}{path}'
            headers = {
                'Authorization': f'Bearer {GATEWAY_TOKEN}',
                'Content-Type': 'application/json'
            }
            
            req = urllib.request.Request(url, data=body, headers=headers, method='POST')
            
            with urllib.request.urlopen(req) as response:
                response_data = response.read()
                
                # Send response
                self.send_response(response.status)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(response_data)
                
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(e.read())
            
        except Exception as e:
            self.send_error(500, f'Proxy error: {str(e)}')

if __name__ == '__main__':
    port = 8765
    server = HTTPServer(('localhost', port), ProxyHandler)
    print(f"✅ CORS Proxy running on http://localhost:{port}")
    print(f"📊 Dashboard: http://localhost:{port}/dashboard-v3.html")
    print(f"🔄 Proxying /api/* → {GATEWAY_URL}")
    server.serve_forever()
