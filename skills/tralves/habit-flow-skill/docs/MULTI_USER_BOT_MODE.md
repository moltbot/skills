# Multi-User Bot Mode (Future Feature)

**Status:** Not implemented. Documentation for future consideration.

---

## Overview

This document outlines how HabitFlow could be extended to work as a **WhatsApp bot service** where multiple external users can interact with a single bot number, each getting isolated habit tracking.

## Use Cases Comparison

### Current: Personal Assistant (Implemented)
- **Who:** Single user (gateway owner)
- **Channels:** WhatsApp, Mac app, web UI, Telegram, etc.
- **Session:** Single main session across all channels (`agent:main:main`)
- **Data:** `~/clawd/habit-flow-data/` (single user)
- **Experience:** "My personal habit tracker" - seamless across devices

### Future: WhatsApp Bot Service (Not Implemented)
- **Who:** Multiple external users
- **Channels:** WhatsApp only (dedicated bot number)
- **Session:** Isolated per phone number (`agent:main:whatsapp:dm:+351912345678`)
- **Data:** Per-user directories (`~/clawd/habit-flow-data/+351912345678/`)
- **Experience:** "A habit tracking bot" - standalone service

### Hybrid: Both Simultaneously (Possible)
- **Personal habits:** Use main session → `~/clawd/habit-flow-data/`
- **Bot users:** Use per-peer sessions → `~/clawd/habit-flow-data/{phoneNumber}/`
- **Configuration:** Detect session type and route data accordingly

---

## Technical Design

### Automatic User Detection

The implementation would be **backwards compatible** - existing single-user mode continues to work unchanged.

#### Storage Layer Changes

**New helper function in `src/storage.ts`:**

```typescript
/**
 * Get data directory based on user context
 * - Multi-user mode: ~/clawd/habit-flow-data/{userId}/
 * - Single-user mode: ~/clawd/habit-flow-data/
 */
function getUserDataDir(): string {
  const userId = process.env.HABITFLOW_USER_ID;

  if (userId) {
    // Multi-user bot mode
    return path.join(process.env.HOME || '~', 'clawd', 'habit-flow-data', userId);
  }

  // Single-user personal mode (current behavior)
  return path.join(process.env.HOME || '~', 'clawd', 'habit-flow-data');
}
```

**Update all path constants:**

```typescript
const DATA_DIR = getUserDataDir();
const HABITS_FILE = path.join(DATA_DIR, 'habits.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const LOGS_DIR = path.join(DATA_DIR, 'logs');
```

#### Agent Instructions (SKILL.md)

Add user context detection logic:

```markdown
## User Context Detection

Before running any scripts, detect the session context:

1. Check your current session identifier
2. If session matches pattern `whatsapp:dm:+[0-9]+`:
   - Extract phone number from session key
   - Set environment: `HABITFLOW_USER_ID={phoneNumber}`
   - Run scripts with this env var
3. Otherwise (main session or other channels):
   - Run scripts normally (single-user mode)
   - No env var needed

Example script calls:

```bash
# Multi-user bot mode (WhatsApp bot user)
HABITFLOW_USER_ID=+351912345678 npx tsx scripts/manage_habit.ts create --name "Meditation" ...

# Single-user personal mode (your own habits)
npx tsx scripts/manage_habit.ts create --name "Meditation" ...
```

The agent should automatically detect which mode based on the session context.
```

#### Session Configuration

**Clawdbot configuration for bot mode:**

```json5
// ~/.clawdbot/clawdbot.json
{
  session: {
    dmScope: "per-channel-peer"  // Each WhatsApp user gets isolated session
  },
  channels: {
    whatsapp: {
      accounts: {
        bot: {
          // Dedicated bot number (different from personal)
          dmPolicy: "open",         // Accept messages from anyone
          allowFrom: ["*"]          // Or use allowlist for controlled access
        }
      }
    }
  }
}
```

Session keys would automatically be:
- Personal session: `agent:main:main`
- Bot user A: `agent:main:whatsapp:dm:+351111111111`
- Bot user B: `agent:main:whatsapp:dm:+351222222222`

#### Data Structure

```
~/clawd/habit-flow-data/
├── habits.json                    # Personal habits (main session)
├── config.json                    # Personal config
├── logs/                          # Personal logs
│   └── h_abc123_2026.jsonl
├── +351111111111/                 # Bot user A
│   ├── habits.json
│   ├── config.json
│   └── logs/
│       └── h_def456_2026.jsonl
├── +351222222222/                 # Bot user B
│   ├── habits.json
│   ├── config.json
│   └── logs/
│       └── h_ghi789_2026.jsonl
└── +351333333333/                 # Bot user C
    ├── habits.json
    ├── config.json
    └── logs/
        └── h_jkl012_2026.jsonl
```

#### Reminder Routing

Each user's reminders would automatically route back to their phone:

```typescript
// In sync_reminders.ts
const deliveryTo = habit.reminderSettings.to || userId; // userId = phone number

cronParts.push(`--to "${deliveryTo}"`);
```

---

## Backwards Compatibility

**Guaranteed:** Existing single-user installations will continue to work without any changes.

- No env var set → Uses `~/clawd/habit-flow-data/` (current behavior)
- Session is `main` → Single-user mode
- All existing habits, logs, reminders work unchanged

**Migration:** None needed. Current users won't be affected.

---

## Clawdbot Suitability Analysis

### Is Clawdbot a Good Fit for Bot Mode?

#### Pros ✅

- Already handles WhatsApp via Baileys (reliable)
- Session isolation built-in (`per-channel-peer`)
- Runs 24/7 as gateway service
- Powerful AI capabilities (coaching, NLP, adaptive responses)
- No 24h window limitation (WhatsApp Web, not Business API)
- Easy to deploy (single Node.js server)
- No message templates required
- Claude's coaching is high quality

#### Cons ❌

- Designed for personal assistant, not public bot service
- No built-in user management or authentication
- No rate limiting or abuse prevention
- No billing/payment integration
- No admin dashboard or user analytics
- Heavy: Full LLM API call per message (expensive at scale)
- No monitoring/alerting for bot health
- Session storage not optimized for 1000+ users

### Scale Recommendations

| User Count | Clawdbot Fit? | Notes |
|------------|---------------|-------|
| **1-10** (Personal + family) | ✅ **Perfect** | Simple setup, low overhead, ideal use case |
| **10-100** (Small community) | ✅ **Good** | Works well. Monitor API costs. Consider rate limits. |
| **100-1000** (Small business) | ⚠️ **Possible** | Need custom rate limiting, monitoring, cost controls |
| **1000+** (Public service) | ❌ **No** | Build custom solution or use dedicated platform |

**Cost estimate at scale:**
- Average habit tracking session: 3-5 LLM calls/day/user
- Claude API cost: ~$3-15 per 1M tokens (Sonnet)
- 100 active users: ~$50-150/month in API costs
- 1000 active users: ~$500-1500/month in API costs

### Alternative Platforms for Large-Scale Bot Mode

If scaling beyond 100 users, consider:

#### 1. Custom Baileys + Backend
- Use Baileys library directly (same as clawdbot)
- Build lightweight Node.js service
- Add user management, rate limiting, analytics
- More control, less overhead per message
- **Best for:** 100-10,000 users with custom needs

#### 2. WhatsApp Business Cloud API (Official)
- Meta's official API platform
- Built-in webhooks, templates, message queue
- Pay per conversation (~$0.005-0.09 per message)
- Requires business verification
- **Limitation:** 24h response window for non-template messages
- **Best for:** Official businesses needing scale

#### 3. Bot Platforms
- **BotPress** (open-source): Visual flow builder, self-hosted
- **Rasa** (ML-based): Advanced NLP, self-hosted
- **Botkit** (framework): Build custom bots with less infrastructure
- **Best for:** Teams without deep ML expertise

#### 4. No-Code Automation
- **n8n** (self-hosted): Connect Claude API + WhatsApp
- **Make.com / Zapier**: SaaS automation platforms
- **Best for:** MVP/prototype, no coding required

---

## Implementation Checklist

When implementing bot mode in the future:

### Phase 1: Core Multi-User Support
- [ ] Add `getUserDataDir()` to storage.ts
- [ ] Update all file path constants to use dynamic paths
- [ ] Add `HABITFLOW_USER_ID` environment variable support
- [ ] Update SKILL.md with user detection logic
- [ ] Test single-user mode (backwards compatibility)
- [ ] Test multi-user mode (isolated data)

### Phase 2: Bot Configuration
- [ ] Document clawdbot.json setup for bot mode
- [ ] Add dedicated WhatsApp account instructions
- [ ] Configure `session.dmScope: "per-channel-peer"`
- [ ] Set up allowlist or open DM policy
- [ ] Test session isolation

### Phase 3: User Experience
- [ ] Welcome message for new bot users
- [ ] Help command (quick reference)
- [ ] User cannot see other users' data
- [ ] Reminders route to correct phone numbers
- [ ] Error handling for invalid contexts

### Phase 4: Production Readiness (Optional)
- [ ] Rate limiting (X messages per user per day)
- [ ] Cost monitoring (track LLM API usage)
- [ ] User analytics (active users, engagement)
- [ ] Admin commands (block users, view stats)
- [ ] Backup strategy for user data
- [ ] GDPR compliance (data export, deletion)

### Phase 5: Scaling (If Needed)
- [ ] Database migration (SQLite or PostgreSQL)
- [ ] Caching layer (Redis)
- [ ] Load balancer (multiple gateway instances)
- [ ] Message queue (handle bursts)
- [ ] Consider alternative platforms

---

## Security Considerations

### Bot Mode Risks

1. **Spam/Abuse:** No rate limiting means users can send unlimited messages
2. **Data Privacy:** User data stored on your server
3. **Cost Attacks:** Malicious users can rack up LLM API costs
4. **No Authentication:** Anyone with the number can use the bot
5. **Session Hijacking:** If phone numbers change, data access issues

### Mitigations

- Start with allowlist-only (`allowFrom: ["+351111...", "+351222..."]`)
- Implement message rate limits (e.g., 20 messages/day/user)
- Set up cost alerts in Anthropic console
- Regular backups of `~/clawd/habit-flow-data/`
- Consider GDPR compliance for European users

---

## Testing Strategy

### Test Scenarios

1. **Single-user mode (must not break):**
   - Create habit without HABITFLOW_USER_ID
   - Verify data in `~/clawd/habit-flow-data/`
   - Log habits, check streaks, set reminders
   - All existing functionality works

2. **Multi-user mode:**
   - Set `HABITFLOW_USER_ID=+351111111111`
   - Create habit, verify data in `~/clawd/habit-flow-data/+351111111111/`
   - Set `HABITFLOW_USER_ID=+351222222222`
   - Create habit, verify separate data directory
   - Ensure no data leakage between users

3. **Hybrid mode:**
   - Use both modes simultaneously
   - Personal habits in main directory
   - Bot users in separate directories
   - Reminders route correctly

4. **Session detection:**
   - Agent detects `whatsapp:dm:+351...` session → sets env var
   - Agent detects `main` session → no env var
   - Scripts run with correct context

---

## Future Enhancements

Beyond basic multi-user support:

1. **User Profiles:** Store name, timezone, preferences per user
2. **Shared Habits:** Family/team habits with multiple participants
3. **Leaderboards:** Community challenges and competitions
4. **Export/Import:** Let users take their data
5. **Multi-Language:** Support non-English users
6. **Voice Messages:** Parse WhatsApp voice notes
7. **Images:** OCR for hand-written habit logs
8. **Integrations:** Connect to Apple Health, Google Fit, etc.

---

## Decision Framework

**Use bot mode with clawdbot if:**
- ✅ Serving personal + small group (< 50 users)
- ✅ You value sophisticated AI coaching
- ✅ You're okay with hosting costs
- ✅ You don't need billing/payments
- ✅ You can handle basic admin manually

**Consider alternatives if:**
- ❌ Expecting 100+ users
- ❌ Need to monetize (billing required)
- ❌ Want fine-grained rate limiting
- ❌ Need lighter/cheaper infrastructure
- ❌ Require SLA/uptime guarantees
- ❌ Must have admin dashboard

---

## Conclusion

Bot mode is **technically feasible** with clawdbot and would be **backwards compatible** with current single-user mode.

However, clawdbot is optimized for **personal assistant** use cases, not large-scale bot services. For small groups (< 50 users), it's a great fit. Beyond that, consider dedicated bot platforms or custom solutions.

**Recommendation:** Start with personal mode (current implementation). If demand grows for multi-user, implement bot mode. If scaling beyond 100 users, evaluate alternatives.

---

## References

- Clawdbot Multi-Agent Docs: `/docs/concepts/multi-agent.md`
- Clawdbot Session Docs: `/docs/concepts/session.md`
- Clawdbot WhatsApp Docs: `/docs/channels/whatsapp.md`
- HabitFlow Implementation Plan: `~/.claude/plans/magical-munching-wirth.md`
