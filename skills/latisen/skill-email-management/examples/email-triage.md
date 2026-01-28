# Email Triage Guide

Email triage is the process of quickly assessing and categorizing emails to determine priority and action needed. Think of it like a hospital emergency room - not all emails need immediate attention, but you need to quickly identify which ones do.

## Triage vs. Inbox Zero

**Triage**: Quick categorization and prioritization (10-15 min)
**Inbox Zero**: Complete processing to empty inbox (30-60 min)

Use triage when:
- You're short on time
- You have hundreds of unread emails
- You need to identify urgent items quickly
- You're returning from vacation
- You want to stay on top of email without full processing

## The Triage Priority System

### Priority Levels

**P0 - URGENT (Red Alert)**
- Requires immediate action (within 1 hour)
- Time-sensitive deadlines
- System outages or critical issues
- Boss requests with tight deadlines

**P1 - HIGH (Yellow Alert)**
- Important but not immediately urgent
- Should handle today
- Key stakeholder requests
- Project-critical information

**P2 - MEDIUM (Green Light)**
- Important but can wait 1-2 days
- Routine project updates
- Non-urgent requests
- Scheduled meetings/events

**P3 - LOW (Blue Zone)**
- Can wait indefinitely
- FYI emails
- Newsletters and reading material
- Nice-to-have information

**P4 - NOISE (Gray Area)**
- Delete immediately
- Spam, promotions, unwanted newsletters
- Irrelevant CCs

## Quick Triage Workflow (10-15 minutes)

### Step 1: Get Situational Awareness (2 min)
```
get_inbox_overview()
```

**Look for**:
- Total unread count
- Which accounts have emails
- Recent email subjects
- Any obvious urgent keywords

### Step 2: Identify Urgent (P0) Items (3-5 min)
```
search_emails(subject_keyword="urgent", read_status="unread")
search_emails(subject_keyword="ASAP", read_status="unread")
search_emails(subject_keyword="immediate", read_status="unread")
```

**Additional searches**:
- Boss's name: `search_emails(sender="boss@company.com", read_status="unread")`
- "action required": `search_emails(subject_keyword="action required", read_status="unread")`
- "deadline": `search_emails(subject_keyword="deadline", read_status="unread")`

**Actions**:
- Read and assess immediately
- Respond if quick (<2 min)
- Flag for immediate action: `update_email_status(action="flag", subject_keyword="...")`
- Move to "Action Required" folder if you have one

### Step 3: Scan for Important Senders (P1) (3-5 min)
```
search_emails(sender="key-stakeholder@company.com", read_status="unread")
search_emails(sender="important-client@client.com", read_status="unread")
```

**VIP Senders to check**:
- Direct manager
- C-suite executives
- Key clients
- Project sponsors
- Important external partners

**Actions**:
- Read subject lines
- Open if looks important
- Flag for today: `update_email_status(action="flag", ...)`
- Quick reply if possible

### Step 4: Quick Scan Remaining (P2-P4) (3-5 min)
```
get_recent_emails(count=50, include_content=False)
```

**Rapid categorization by subject line**:
- **Calendar invites**: Accept/decline immediately
- **Automated notifications**: Mark read or trash
- **Newsletters**: Mass mark as read or move to reading folder
- **CCs you're on**: Quickly assess relevance

**Batch operations**:
- Trash newsletters: `manage_trash(action="move_to_trash", sender="newsletter@...")`
- Mark read automated: `update_email_status(action="mark_read", sender="no-reply@...")`

### Step 5: Set Context for Later (1-2 min)
```
get_unread_count()
```

**Mental note**:
- How many emails need full processing later?
- When will you do full inbox processing?
- Are there patterns (too many from one source)?

## Advanced Triage Techniques

### The "Batch Triage" Method

**For high email volume (100+ unread)**:

1. **First Pass - Delete (5 min)**
   - Identify and bulk delete obvious noise
   - Promotions, old automated emails, spam
   ```
   search_emails(sender="promotions@", read_status="unread")
   manage_trash(action="move_to_trash", sender="promotions@", max_deletes=20)
   ```

2. **Second Pass - Flag Urgent (5 min)**
   - Search and flag all P0 items
   - Use multiple search terms
   ```
   search_emails(subject_keyword="urgent", read_status="unread")
   update_email_status(action="flag", subject_keyword="urgent", max_updates=10)
   ```

3. **Third Pass - Mark Read FYIs (3 min)**
   - Bulk mark read items you don't need to open
   - CCs, automated reports you'll skip
   ```
   update_email_status(action="mark_read", sender="automated@", max_updates=20)
   ```

4. **Fourth Pass - Categorize Rest (7 min)**
   - Quickly scan remaining unread
   - Flag high priority, defer medium priority

### The "Time-Box Triage" Method

**Set 15-minute timer**:

- **Minutes 0-5**: Urgent only (P0)
- **Minutes 5-10**: Important senders (P1)
- **Minutes 10-15**: Quick wins (easy deletes, marks as read)

**When timer ends**: Stop triaging. You've identified what matters.

### The "Vacation Recovery" Method

**For returning from extended absence (200+ unread)**:

1. **Context Setting (5 min)**
   ```
   get_inbox_overview()
   get_statistics(scope="account_overview", days_back=14)
   ```
   - Understand what happened while away
   - Identify top senders

2. **Aggressive Culling (15 min)**
   - Delete all promotional emails
   - Mark read all automated reports (they're old news now)
   - Archive all meeting invites that already happened
   ```
   search_emails(date_to="2025-01-15")  # Before you returned
   # Review and bulk archive/delete
   ```

3. **Search for Your Name (10 min)**
   ```
   search_emails(subject_keyword="[Your Name]", read_status="unread")
   ```
   - Find emails specifically about you or to you
   - These are likely important

4. **Key Stakeholder Scan (15 min)**
   - Check emails from boss, direct reports, key clients
   - Read chronologically to understand what happened

5. **Acknowledge Return (10 min)**
   - Send quick "I'm back" replies to important threads
   - Set expectations: "Catching up, will respond by [date]"

6. **Full Triage (30 min)**
   - Apply standard triage to remaining emails

## Triage Decision Tree

```
New Email Arrives
    |
    ├── From VIP Sender?
    │   └── YES → Read immediately, flag if needs action
    │
    ├── Subject contains "urgent/ASAP/immediate"?
    │   └── YES → Read immediately, assess priority
    │
    ├── Contains my name in subject?
    │   └── YES → Read subject, flag if actionable
    │
    ├── Automated/Newsletter?
    │   └── YES → Mark read or delete
    │
    ├── FYI/CC only?
    │   └── YES → Skim or mark read
    │
    └── Regular email → Process during next full inbox session
```

## Triage Shortcuts & Patterns

### Search Patterns for Quick Triage

**Urgency Indicators**:
```
search_emails(subject_keyword="urgent")
search_emails(subject_keyword="ASAP")
search_emails(subject_keyword="today")
search_emails(subject_keyword="immediate")
search_emails(subject_keyword="deadline")
```

**Noise Indicators (for bulk deletion)**:
```
search_emails(subject_keyword="unsubscribe")  # Newsletters
search_emails(sender="no-reply@")  # Automated
search_emails(sender="noreply@")  # Automated
search_emails(subject_keyword="[Automated]")
```

**Action Indicators**:
```
search_emails(subject_keyword="action required")
search_emails(subject_keyword="please review")
search_emails(subject_keyword="your approval")
search_emails(subject_keyword="response needed")
```

### Batch Status Operations

**Flag all urgent for processing**:
```
update_email_status(action="flag", subject_keyword="urgent", max_updates=10)
```

**Mark read all automated**:
```
update_email_status(action="mark_read", sender="automated@", max_updates=20)
```

**Unflag old items** (weekly cleanup):
```
# Find flagged items
search_emails(mailbox="All")  # Look for flags manually
# Unflag completed ones
update_email_status(action="unflag", subject_keyword="...", max_updates=10)
```

## Daily Triage Schedules

### Morning Triage (First thing, 10-15 min)
- Check overnight emails
- Identify urgent items for the day
- Flag high-priority items
- Quick replies to easy questions

### Midday Triage (After lunch, 5-10 min)
- Scan morning emails
- Handle quick wins
- Adjust priorities for afternoon

### End-of-Day Triage (Before leaving, 10 min)
- Check afternoon emails
- Flag items for tomorrow
- Quick cleanup (delete obvious noise)
- Set expectations (if something needs reply tomorrow)

### Optional: Evening Triage (Before bed, 5 min)
- Check for emergencies only
- Flag for morning if critical
- Otherwise, let it wait

## Triage Metrics

**Track these to improve triage efficiency**:

1. **Triage Time**: How long does quick triage take?
   - Target: <15 minutes
   - Improve by: Better search patterns, ruthless deletion

2. **Miss Rate**: How many "urgent" emails did you miss in triage?
   - Target: <1 per week
   - Improve by: Better urgency keywords, VIP sender lists

3. **False Positive Rate**: How many flagged emails weren't actually urgent?
   - Target: <20%
   - Improve by: Calibrate urgency thresholds

4. **Processing Debt**: Unread count after triage
   - Target: <50 unread
   - Improve by: More aggressive deletion, better triage

## Common Triage Mistakes

### 1. Reading Every Email During Triage
**Problem**: Triage becomes processing; takes too long
**Solution**: Only read subject lines unless urgent

### 2. Acting on Non-Urgent Emails
**Problem**: Get sidetracked from urgent items
**Solution**: Flag for later, stay focused on triage

### 3. Not Deleting Aggressively
**Problem**: Too many low-priority emails clog inbox
**Solution**: "When in doubt, delete it out" - you can always search later

### 4. Over-Flagging
**Problem**: Everything flagged means nothing is prioritized
**Solution**: Only flag P0 and P1 items, 10 flags max

### 5. Skipping Triage When Busy
**Problem**: Urgent items get buried; fires start
**Solution**: Triage is MORE important when busy, not less

## Integration with Full Processing

**Triage is not a replacement for inbox processing**:

- **Triage**: Quick scan (10-15 min) → Identifies priorities
- **Processing**: Full handling (30-60 min) → Achieves inbox zero

**Ideal Daily Pattern**:
1. Morning: Quick triage (10 min)
2. Mid-morning: Full processing (30 min)
3. Midday: Quick triage (5 min)
4. Afternoon: Full processing if needed (30 min)
5. End-of-day: Quick triage (5 min)

## Tools Summary

| Task | Tool | Example |
|------|------|---------|
| Quick overview | `get_inbox_overview()` | Start here always |
| Find urgent | `search_emails()` | subject_keyword="urgent" |
| Check VIPs | `search_emails()` | sender="boss@company.com" |
| Bulk flag | `update_email_status()` | action="flag" |
| Bulk trash | `manage_trash()` | action="move_to_trash" |
| Bulk mark read | `update_email_status()` | action="mark_read" |
| Recent scan | `get_recent_emails()` | count=50 |
| Check counts | `get_unread_count()` | See progress |

## Remember

**Triage is about speed, not perfection**:
- It's okay to miss non-urgent emails
- Better to flag too few than too many
- Delete aggressively - you can always search
- Urgency is relative - calibrate to your role
- Triage is a skill that improves with practice

**When in doubt, ask yourself**:
- "What happens if I don't see this email today?"
- If answer is "nothing bad", defer it

---

**Start practicing**: Set a 10-minute timer right now and triage your inbox. Focus only on finding urgent items. Stop when timer goes off.
