---
name: linear-webhook
description: "Comment @mason or @eureka in Linear issues to dispatch tasks to agents. Webhook receives Linear comments and routes to correct agent."
---

# Linear Webhook Skill

Enables Linear issue comment @mentions to dispatch tasks to Clawdbot agents.

## How It Works

1. **Comment in Linear:** `@mason implement user authentication` or `@eureka plan Q2 roadmap`
2. **Linear webhook fires** on comment creation
3. **Clawdbot receives webhook** via exposed endpoint
4. **Transform parses payload:**
   - Extracts @mason or @eureka mention
   - Gets issue context (title, description, labels)
   - Prepares task prompt
5. **Routes to agent session:**
   - @mason → `mason` agent (code/implementation)
   - @eureka → `eureka` agent (planning/strategy)
6. **Agent processes task** and returns result
7. **Result posted back** as Linear comment

## Setup

### 1. Configure Clawdbot Webhooks

Add to your `config.json5`:

```json5
{
  hooks: {
    enabled: true,
    token: "your-secret-token-here", // Generate with: openssl rand -base64 32
    path: "/hooks",
    transformsDir: "/home/sven/clawd-mason/skills/linear-webhook",
    mappings: [
      {
        name: "linear",
        match: {
          path: "/linear",
          method: "POST"
        },
        action: "agent",
        transform: {
          module: "./linear-transform.js",
          export: "transformLinearWebhook"
        },
        deliver: false, // Don't auto-deliver to chat - Linear comments handle responses
      }
    ]
  }
}
```

### 2. Expose Webhook Endpoint

Use Cloudflare Tunnel or Tailscale Funnel to make webhook publicly accessible:

**Option A: Cloudflare Tunnel** (Recommended)
```bash
# Install if needed
brew install cloudflared

# Start tunnel (replace with your domain)
cloudflared tunnel --url http://localhost:18789
```

**Option B: Tailscale Funnel**
```bash
# Enable funnel
tailscale funnel 18789
```

Note the public URL (e.g., `https://your-tunnel.trycloudflare.com`)

### 3. Configure Linear Webhook

1. Go to Linear Settings → API → Webhooks
2. Click "Create new webhook"
3. Set URL: `https://your-tunnel.trycloudflare.com/hooks/linear`
4. Add custom header: `x-clawdbot-token: your-secret-token-here`
5. Select events: **Comment → Created**
6. Save webhook

### 4. Test

Comment in a Linear issue:
```
@mason add user authentication to the login page
```

Expected flow:
1. Webhook fires to Clawdbot
2. Mason agent receives task
3. Mason implements or responds
4. Result posted back to Linear issue as comment

## Agent Routing

- **@mason** → Code implementation, debugging, technical tasks
- **@eureka** → Planning, strategy, research, communication
- Other mentions → Ignored (not handled)

## Issue Context Provided

The agent receives:
- Issue title
- Issue description
- Issue labels
- Comment text (the @mention)
- Issue URL
- Commenter name

## Customization

### Add More Agents

Edit `linear-transform.js`:

```javascript
const AGENT_MENTIONS = {
  '@mason': 'mason',
  '@eureka': 'eureka',
  '@designer': 'designer', // Add your own agents
};
```

### Change Response Behavior

Modify `deliver` and `channel` in config:

```json5
{
  deliver: true,
  channel: "telegram",
  to: "1878354815", // Your Telegram chat ID
}
```

This will also send agent responses to Telegram.

## Security

- **Never commit hook token** to version control
- Use environment variables: `CLAWDBOT_HOOK_TOKEN`
- Verify webhook source (Linear's IP ranges if needed)
- Use HTTPS only (Cloudflare Tunnel provides this)

## Troubleshooting

### Webhook not firing
- Check Linear webhook logs (Settings → API → Webhooks → View logs)
- Verify tunnel is running: `curl https://your-tunnel.trycloudflare.com/hooks/linear`
- Check Clawdbot logs: `clawdbot gateway logs`

### Agent not responding
- Check transform is loading: Look for errors in gateway logs
- Verify agent session exists: `clawdbot sessions list`
- Test transform manually: `node linear-transform.js`

### Response not posting to Linear
- Implement Linear API comment posting in transform
- Add Linear API token to config
- See `linear-transform.js` for example

## Linear API Access

To post comments back to Linear, you need a Linear API token:

1. Go to Linear Settings → API → Personal API keys
2. Create new token with `write` scope
3. Add to environment: `CLAWDBOT_LINEAR_API_KEY=lin_api_...`
4. Transform will use this to post responses

## Files

- `SKILL.md` - This documentation
- `linear-transform.js` - Webhook payload parser and agent router
- `linear-api.js` - Linear GraphQL API client (for posting comments)
- `example-payload.json` - Sample Linear webhook payload for testing

## References

- [Clawdbot Webhook Docs](/automation/webhook)
- [Linear Webhooks API](https://developers.linear.app/docs/graphql/webhooks)
- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
