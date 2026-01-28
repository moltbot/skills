# LinkedIn Monitor Cron Payload

This is the instruction set for the hourly LinkedIn monitoring cron.

## Cron Payload (copy this for cron setup)

```
LinkedIn inbox check (browser-based).

STEP 1: Read state file
- Read ~/.clawdbot/linkedin-monitor/state/messages.json
- Extract seenIds list

STEP 2: Check LinkedIn
- Use browser tool (profile: clawd) - DO NOT CLOSE IT
- Navigate to linkedin.com/messaging/ if not already there
- Take snapshot

STEP 3: Parse conversations
- Extract each conversation from snapshot
- For each: name, last message preview, timestamp, isFromMe
- Identify INBOUND messages (where last message is NOT from me)

STEP 4: Compare against state
- For each inbound message, create unique ID: {name}_{timestamp}
- Check if ID exists in seenIds
- Collect only NEW messages (ID not in seenIds)

STEP 5: If NEW messages found
- Draft reply for each using USER.md communication style
- Read alertChannel and alertTarget from ~/.clawdbot/linkedin-monitor/config.json
- Post to the configured channel (Discord, Telegram, Slack, WhatsApp, etc.):
  Format:
  📬 **{Name}**
  > {message preview}
  
  **Draft reply:**
  > {your drafted reply}
  
  Reply "send {name}" to approve.

STEP 6: Update state
- Add new message IDs to seenIds
- Update lastCheck timestamp
- Write to ~/.clawdbot/linkedin-monitor/state/messages.json

STEP 7: If NO new messages
- Stay silent (no message to any channel)
- Still update lastCheck timestamp

IMPORTANT:
- DO NOT close the clawd browser
- DO NOT report messages already in seenIds
- Each message reported ONCE only
```

## Example State File

```json
{
  "seenIds": [
    "Marissa Campbell_4:43 AM",
    "Karan (Kavnit)_Jan 27"
  ],
  "lastCheck": "2026-01-28T16:47:00Z"
}
```
