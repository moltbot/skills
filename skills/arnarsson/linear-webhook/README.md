# Linear Webhook Skill

Enables @mason and @eureka mentions in Linear issue comments to dispatch tasks to Clawdbot agents.

## Quick Start

### 1. Install Dependencies
```bash
# None required - uses Node.js built-ins
```

### 2. Configure Clawdbot

Add this to your Clawdbot config (`.clawd/config.json5`):

```json5
{
  hooks: {
    enabled: true,
    token: process.env.CLAWDBOT_HOOK_TOKEN,
    path: "/hooks",
    transformsDir: "/home/sven/clawd-mason/skills/linear-webhook",
    mappings: [
      {
        name: "linear",
        match: { path: "/linear", method: "POST" },
        action: "agent",
        transform: {
          module: "./linear-transform.js",
          export: "transformLinearWebhook"
        },
        deliver: false,
      }
    ]
  }
}
```

### 3. Set Environment Variables

```bash
# Generate hook token
export CLAWDBOT_HOOK_TOKEN=$(openssl rand -base64 32)

# Get Linear API key from: https://linear.app/settings/api
export LINEAR_API_KEY="lin_api_your_key_here"
```

### 4. Expose Webhook Endpoint

**Option A: Cloudflare Tunnel** (Recommended)
```bash
# Install
brew install cloudflared

# Start tunnel
cloudflared tunnel --url http://localhost:18789

# Note the public URL (e.g., https://abc-123.trycloudflare.com)
```

**Option B: Tailscale Funnel**
```bash
tailscale funnel 18789
```

### 5. Configure Linear Webhook

1. Go to **Linear Settings** → **API** → **Webhooks**
2. Click "Create new webhook"
3. **URL:** `https://your-tunnel-url.trycloudflare.com/hooks/linear`
4. **Custom Header:** 
   - Name: `x-clawdbot-token`
   - Value: `your-CLAWDBOT_HOOK_TOKEN`
5. **Events:** Select **Comment → Created**
6. **Save**

### 6. Test

Comment in a Linear issue:
```
@mason implement OAuth2 authentication
```

Check Clawdbot logs:
```bash
clawdbot gateway logs
```

## Usage

### Mention Agents

- **@mason** - Code implementation, debugging, technical tasks
- **@eureka** - Planning, strategy, research, communication

### Example Comments

```
@mason add user authentication to the API

@eureka plan the Q2 product roadmap

@mason debug the failing test in src/auth.test.js

@eureka research competitors and create comparison doc
```

## Agent Context

Agents receive full issue context:
- Issue title & description
- Issue labels
- Priority level
- Current status
- Assignee
- Comment text
- URL to issue

## Response Posting

To enable automatic posting of agent responses back to Linear:

1. Get Linear API key with `write` scope
2. Set `LINEAR_API_KEY` environment variable
3. Uncomment the response posting code in `linear-transform.js`
4. Restart Clawdbot gateway

## File Structure

```
linear-webhook/
├── SKILL.md                  # Main documentation
├── README.md                 # This file
├── linear-transform.js       # Webhook payload parser
├── config-example.json5      # Configuration template
├── example-payload.json      # Sample Linear webhook payload
└── test.sh                   # Testing script
```

## Testing

### Test Transform Locally
```bash
node linear-transform.js
```

### Test Webhook Endpoint
```bash
curl -X POST http://localhost:18789/hooks/linear \
  -H "x-clawdbot-token: your-token" \
  -H "Content-Type: application/json" \
  -d @example-payload.json
```

### Monitor Logs
```bash
# Clawdbot gateway logs
clawdbot gateway logs --follow

# Or check session logs
clawdbot sessions list
```

## Troubleshooting

### Webhook not firing
- Check Linear webhook logs (Settings → API → Webhooks → View logs)
- Verify tunnel is running: `curl https://your-tunnel-url/hooks/linear`
- Check Clawdbot logs: `clawdbot gateway logs`

### Transform not loading
- Check `transformsDir` path in config
- Verify `linear-transform.js` exists and has no syntax errors
- Check gateway logs for errors

### Agent not receiving task
- Verify agent session exists: `clawdbot sessions list`
- Check session key format: `linear:mason:issue-123`
- Ensure webhook delivered successfully (200/202 response)

### Response not posting to Linear
- Verify `LINEAR_API_KEY` is set
- Check Linear API token has `write` scope
- Look for errors in `postLinearComment` function logs

## Security

- **Never commit tokens** to version control
- Use environment variables for sensitive values
- Keep webhook endpoint behind tunnel (not publicly exposed without auth)
- Verify webhook source (Linear's IP ranges)
- Rotate hook token regularly

## Limitations

- Currently supports only @mason and @eureka
- One mention per comment (takes first if multiple)
- Requires public endpoint (tunnel or proxy)
- Response posting is manual (requires additional code)

## Future Enhancements

- [ ] Support more agents (@designer, @qa, etc.)
- [ ] Multi-agent collaboration on single issue
- [ ] Automatic response posting via Linear API
- [ ] Thread tracking (multi-turn conversations)
- [ ] Priority-based routing
- [ ] Label-based agent selection
- [ ] Status updates (move issue to "In Progress" on agent accept)
- [ ] Time tracking integration
- [ ] Mention multiple agents in one comment

## Contributing

To add new agent mentions:

1. Edit `AGENT_MENTIONS` in `linear-transform.js`
2. Add agent name mapping
3. Ensure agent session exists in Clawdbot config
4. Test with example payload

## License

MIT - Use freely for personal and commercial projects
