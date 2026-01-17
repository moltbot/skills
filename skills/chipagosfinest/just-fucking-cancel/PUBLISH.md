# Publishing just-fucking-cancel to ClawdHub

## Attribution
- **Original**: https://github.com/rohunvora/just-fucking-cancel by @rohunvora
- **Adapted for ClawdBot**: @chipagosfinest
- **Mostly written by**: Claude (Anthropic)

## Publish Command

```bash
# 1. Install ClawdHub CLI (if not already)
npm i -g clawdhub

# 2. Login to ClawdHub
clawdhub login

# 3. Publish the skill
cd /path/to/clawdbot-railway
clawdhub publish ./skills/just-fucking-cancel \
  --slug just-fucking-cancel \
  --name "just-fucking-cancel" \
  --version 1.0.0 \
  --changelog "Initial release - subscription audit and cancellation skill.

Originally created by rohunvora (https://github.com/rohunvora/just-fucking-cancel).
Adapted for ClawdBot by @chipagosfinest.
Mostly written by Claude.

Features:
- Analyze bank CSV exports to find recurring charges
- Interactive categorization (Cancel/Investigate/Keep)
- HTML audit report with privacy toggle
- Browser automation for cancellations
- 50+ common service cancel URLs

DM @chipagosfinest on X if you need anything."
```

## After Publishing

The skill will be available at:
```
https://clawdhub.com/chipagosfinest/just-fucking-cancel
```

Add to any clawdbot.json:
```json
"just-fucking-cancel": {
  "location": "https://clawdhub.com/chipagosfinest/just-fucking-cancel"
}
```

Or install via CLI:
```bash
clawdhub install chipagosfinest/just-fucking-cancel
```
