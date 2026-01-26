#!/usr/bin/env python3
"""
Nest Pub/Sub Webhook Server

Receives push messages from Google Cloud Pub/Sub for Nest device events.
For doorbell events, captures a snapshot via the SDM GenerateImage API
and sends it directly to Telegram for speed.
"""

import base64
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.request
import urllib.error
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler

# --- Config ---
GATEWAY_URL = os.environ.get('CLAWDBOT_GATEWAY_URL', 'http://localhost:18789')
HOOKS_TOKEN = os.environ.get('CLAWDBOT_HOOKS_TOKEN', '')
TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', '')
TELEGRAM_CHAT_ID = os.environ.get('TELEGRAM_CHAT_ID', '8294369833')

# 1Password token for Nest API credentials
OP_TOKEN = os.environ.get('OP_TOKEN_ANDREW', '')

# Cache for Nest credentials and access token
_nest_creds = {}
_access_token = {'token': None, 'expires': 0}

EVENT_TYPES = {
    'sdm.devices.events.DoorbellChime.Chime': '🔔 Doorbell rang!',
    'sdm.devices.events.CameraMotion.Motion': '📹 Motion detected',
    'sdm.devices.events.CameraPerson.Person': '🚶 Person detected',
    'sdm.devices.events.CameraSound.Sound': '🔊 Sound detected',
    'sdm.devices.events.CameraClipPreview.ClipPreview': '🎬 Clip ready',
}


def get_nest_creds():
    """Fetch Nest API credentials from 1Password (cached)."""
    global _nest_creds
    if _nest_creds:
        return _nest_creds

    if not OP_TOKEN:
        print("[NEST] No OP_TOKEN_ANDREW set")
        return None

    env = {**os.environ, 'OP_SERVICE_ACCOUNT_TOKEN': OP_TOKEN}
    op = os.path.expanduser('~/.local/bin/op')
    vault_id = 'Alfred'  # Use vault name

    try:
        fields = {}
        for field in ['project_id', 'client_id', 'client_secret', 'refresh_token']:
            result = subprocess.run(
                [op, 'read', f'op://{vault_id}/Nest Device Access API/{field}'],
                capture_output=True, text=True, env=env, timeout=10
            )
            if result.returncode != 0:
                print(f"[NEST] Failed to read {field}: {result.stderr.strip()}")
                return None
            fields[field] = result.stdout.strip()

        _nest_creds = fields
        print(f"[NEST] Credentials loaded (project: {fields['project_id'][:8]}...)")
        return fields
    except Exception as e:
        print(f"[NEST] Error loading credentials: {e}")
        return None


def get_access_token():
    """Get a valid SDM access token, refreshing if needed."""
    global _access_token

    if _access_token['token'] and time.time() < _access_token['expires']:
        return _access_token['token']

    creds = get_nest_creds()
    if not creds:
        return None

    try:
        data = urllib.parse.urlencode({
            'client_id': creds['client_id'],
            'client_secret': creds['client_secret'],
            'refresh_token': creds['refresh_token'],
            'grant_type': 'refresh_token',
        }).encode()

        req = urllib.request.Request('https://oauth2.googleapis.com/token', data=data, method='POST')
        with urllib.request.urlopen(req, timeout=10) as resp:
            result = json.loads(resp.read())
            _access_token['token'] = result['access_token']
            _access_token['expires'] = time.time() + result.get('expires_in', 3600) - 60
            return _access_token['token']
    except Exception as e:
        print(f"[NEST] Token refresh failed: {e}")
        return None


def generate_event_image(device_id, event_id):
    """Use SDM GenerateImage API to get a snapshot from a camera event."""
    token = get_access_token()
    if not token:
        return None

    try:
        url = f'https://smartdevicemanagement.googleapis.com/v1/{device_id}:executeCommand'
        payload = json.dumps({
            'command': 'sdm.devices.commands.CameraEventImage.GenerateImage',
            'params': {'event_id': event_id}
        }).encode()

        req = urllib.request.Request(url, data=payload, method='POST', headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
        })

        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read())
            image_url = result.get('results', {}).get('url')
            image_token = result.get('results', {}).get('token')

            if not image_url:
                print(f"[IMAGE] No URL in response: {result}")
                return None

            # Download the image
            img_req = urllib.request.Request(image_url, headers={
                'Authorization': f'Basic {image_token}',
            })
            with urllib.request.urlopen(img_req, timeout=15) as img_resp:
                image_data = img_resp.read()
                print(f"[IMAGE] Downloaded {len(image_data)} bytes")
                return image_data

    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else ''
        print(f"[IMAGE] API error {e.code}: {body[:500]}")
        return None
    except Exception as e:
        print(f"[IMAGE] Error: {e}")
        return None


def capture_rtsp_frame(device_id):
    """Fallback: capture a frame via RTSP stream."""
    token = get_access_token()
    if not token:
        return None

    try:
        # Generate stream
        url = f'https://smartdevicemanagement.googleapis.com/v1/{device_id}:executeCommand'
        payload = json.dumps({
            'command': 'sdm.devices.commands.CameraLiveStream.GenerateRtspStream',
            'params': {}
        }).encode()

        req = urllib.request.Request(url, data=payload, method='POST', headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
        })

        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read())
            rtsp_url = result.get('results', {}).get('streamUrls', {}).get('rtspUrl')

        if not rtsp_url:
            print("[RTSP] No stream URL returned")
            return None

        # Capture frame with ffmpeg
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as f:
            output_path = f.name

        subprocess.run([
            'ffmpeg', '-y', '-rtsp_transport', 'tcp',
            '-i', rtsp_url, '-frames:v', '1', '-q:v', '2',
            '-f', 'image2', output_path
        ], capture_output=True, timeout=15)

        if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            with open(output_path, 'rb') as f:
                data = f.read()
            os.unlink(output_path)
            print(f"[RTSP] Captured {len(data)} bytes")
            return data

        return None
    except Exception as e:
        print(f"[RTSP] Error: {e}")
        return None


def send_telegram_photo(image_data, caption):
    """Send a photo directly to Telegram."""
    if not TELEGRAM_BOT_TOKEN:
        print("[TELEGRAM] No bot token configured")
        return False

    try:
        import io
        boundary = '----NestWebhookBoundary'
        body = b''

        # chat_id field
        body += f'--{boundary}\r\n'.encode()
        body += b'Content-Disposition: form-data; name="chat_id"\r\n\r\n'
        body += f'{TELEGRAM_CHAT_ID}\r\n'.encode()

        # caption field
        body += f'--{boundary}\r\n'.encode()
        body += b'Content-Disposition: form-data; name="caption"\r\n\r\n'
        body += f'{caption}\r\n'.encode()

        # photo field
        body += f'--{boundary}\r\n'.encode()
        body += b'Content-Disposition: form-data; name="photo"; filename="doorbell.jpg"\r\n'
        body += b'Content-Type: image/jpeg\r\n\r\n'
        body += image_data
        body += b'\r\n'

        body += f'--{boundary}--\r\n'.encode()

        url = f'https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendPhoto'
        req = urllib.request.Request(url, data=body, method='POST', headers={
            'Content-Type': f'multipart/form-data; boundary={boundary}',
        })

        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read())
            if result.get('ok'):
                print(f"[TELEGRAM] Photo sent successfully")
                return True
            else:
                print(f"[TELEGRAM] API error: {result}")
                return False

    except Exception as e:
        print(f"[TELEGRAM] Error sending photo: {e}")
        return False


def send_telegram_message(text):
    """Send a text message to Telegram."""
    if not TELEGRAM_BOT_TOKEN:
        return False

    try:
        payload = json.dumps({
            'chat_id': TELEGRAM_CHAT_ID,
            'text': text,
        }).encode()

        url = f'https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage'
        req = urllib.request.Request(url, data=payload, method='POST', headers={
            'Content-Type': 'application/json',
        })

        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read()).get('ok', False)
    except Exception as e:
        print(f"[TELEGRAM] Error: {e}")
        return False


def send_clawdbot_hook(message):
    """Notify Clawdbot via hook (for awareness, not primary delivery)."""
    if not HOOKS_TOKEN:
        return

    try:
        payload = json.dumps({
            'message': f'NEST EVENT: {message}',
            'name': 'Nest',
            'deliver': False,
        }).encode()

        req = urllib.request.Request(
            f"{GATEWAY_URL}/hooks/agent",
            data=payload, method='POST',
            headers={
                'Authorization': f'Bearer {HOOKS_TOKEN}',
                'Content-Type': 'application/json',
            },
        )
        urllib.request.urlopen(req, timeout=5)
    except Exception as e:
        print(f"[HOOK] Error: {e}")


class NestWebhookHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"[HTTP] {args[0]}")

    def send_json(self, data, status=200):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', len(body))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == '/health':
            self.send_json({'status': 'healthy', 'service': 'nest-webhook'})
        else:
            self.send_json({'error': 'Not found'}, 404)

    def do_POST(self):
        if self.path != '/nest/events':
            self.send_json({'error': 'Not found'}, 404)
            return

        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)

        # ACK immediately so Pub/Sub doesn't retry
        self.send_json({'status': 'ok'})

        # Process event asynchronously-ish (still in handler, but after ACK)
        try:
            envelope = json.loads(body.decode())
            pubsub_message = envelope.get('message', {})
            data_b64 = pubsub_message.get('data', '')
            data = json.loads(base64.b64decode(data_b64).decode())
        except Exception as e:
            print(f"[ERROR] Failed to decode: {e}")
            return

        print(f"[EVENT] {json.dumps(data, indent=2)}")

        resource_update = data.get('resourceUpdate', {})
        events = resource_update.get('events', {})
        device_id = resource_update.get('name', '')

        for event_type, event_data in events.items():
            description = EVENT_TYPES.get(event_type, f'Event: {event_type}')
            event_id = event_data.get('eventId', '')
            timestamp = datetime.utcnow().strftime('%H:%M:%S UTC')

            print(f"[EVENT] {description} | device: {device_id[-8:]} | eventId: {event_id[:12]}")

            # For doorbell/camera events with an eventId, try to get an image
            if event_id and ('Doorbell' in event_type or 'Camera' in event_type):
                caption = f"{description}\n🕐 {timestamp}"

                # Try GenerateImage first (fast), fall back to RTSP
                image_data = generate_event_image(device_id, event_id)
                if not image_data:
                    print("[EVENT] GenerateImage failed, trying RTSP fallback...")
                    image_data = capture_rtsp_frame(device_id)

                if image_data:
                    send_telegram_photo(image_data, caption)
                else:
                    # No image available, send text alert
                    send_telegram_message(f"{description}\n🕐 {timestamp}\n⚠️ Could not capture image")
            else:
                # Non-camera event, just text
                send_telegram_message(f"{description}\n🕐 {timestamp}")

            # Notify Clawdbot for awareness (non-blocking)
            send_clawdbot_hook(description)

        # Log trait updates silently
        traits = resource_update.get('traits', {})
        if traits and not events:
            for trait_name, trait_value in traits.items():
                print(f"[TRAIT] {trait_name}: {trait_value}")


# Need urllib.parse for token refresh
import urllib.parse


def main():
    port = int(os.environ.get('PORT', 8420))
    print(f"Starting Nest webhook server on port {port}")
    print(f"Gateway URL: {GATEWAY_URL}")
    print(f"Hooks token: {'set' if HOOKS_TOKEN else 'NOT SET'}")
    print(f"Telegram bot: {'set' if TELEGRAM_BOT_TOKEN else 'NOT SET'}")
    print(f"Telegram chat: {TELEGRAM_CHAT_ID}")

    # Pre-warm credentials
    get_nest_creds()

    server = HTTPServer(('0.0.0.0', port), NestWebhookHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.shutdown()


if __name__ == '__main__':
    main()
