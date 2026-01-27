# Zoom Authentication Setup

## Server-to-Server OAuth (Recommended)

Best for personal/single-user access. No browser login needed.

### Step 1: Create the App

1. Go to https://marketplace.zoom.us/
2. Click **Develop** → **Build App**
3. Choose **Server-to-Server OAuth**
4. Fill in app name (e.g., "Clawdbot Zoom")

### Step 2: Get Credentials

From the app's **App Credentials** tab, note:
- **Account ID**
- **Client ID**
- **Client Secret**

### Step 3: Add Scopes

In the **Scopes** tab, add:
- `meeting:read:admin`, `meeting:write:admin`
- `recording:read:admin`, `recording:write:admin`
- `chat_channel:read:admin`, `chat_message:read:admin`, `chat_message:write:admin`
- `user:read:admin`
- `phone:read:admin` (optional, for Zoom Phone)

### Step 4: Activate

Click **Activate** on the **Activation** tab.

### Step 5: Configure .env

Add to your workspace `.env`:

```
ZOOM_ACCOUNT_ID=your_account_id
ZOOM_CLIENT_ID=your_client_id
ZOOM_CLIENT_SECRET=your_client_secret
```

## OAuth (User-level)

For apps that need user consent (multi-user). Requires browser-based OAuth flow.
Not covered here — use Server-to-Server for personal assistant use.

## Token Caching

The script caches the access token and auto-refreshes when expired (tokens last 1 hour).
Cache file: `/tmp/zoom_token.json`
