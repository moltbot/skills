# Inbox Zero Workflow

Inbox Zero is a rigorous approach to email management aimed at keeping your inbox empty (or nearly empty) at all times. The inbox becomes a to-do list, not a storage system.

## Philosophy

- **Inbox = Processing Queue**: Your inbox is where emails arrive and wait for decisions, not where they live
- **Touch Once**: Make a decision the first time you read an email
- **Five Possible Actions**: Every email requires one of five actions (see below)
- **Daily Discipline**: Process inbox at least once per day, ideally multiple times

## The Five Actions (D-D-R-D-D)

For every email in your inbox, choose ONE action:

### 1. Delete (or Trash)
**When**: Email has no value, spam, unwanted newsletters
**Tool**: `manage_trash(action="move_to_trash", subject_keyword="...", sender="...")`
**Examples**:
- Spam and promotional emails you'll never read
- Automated notifications you don't need
- Newsletters you never read (consider unsubscribing)
- Old calendar invites or confirmations

**Tip**: Be ruthless. If you haven't read a newsletter in 3 months, you won't read this one either.

### 2. Delegate (or Forward)
**When**: Someone else should handle this email
**Tool**: `forward_email(to="colleague@example.com", subject_keyword="...", message="Can you handle this? Thanks!")`
**Examples**:
- Questions someone else can answer better
- Tasks that belong to another team member
- Customer inquiries that should go to support

**Best Practice**: Add context when forwarding. Don't just forward blindly.

### 3. Respond (or Reply)
**When**: You can respond in under 2 minutes
**Tools**:
- Quick reply: `reply_to_email(reply_body="...", subject_keyword="...")`
- Reply to all: `reply_to_email(reply_body="...", subject_keyword="...", reply_to_all=True)`
**Examples**:
- Quick confirmations ("Yes, I'll be there")
- Simple answers to straightforward questions
- Acknowledgments ("Got it, thanks!")

**The 2-Minute Rule**: If a reply takes less than 2 minutes, do it immediately. If it takes longer, move to Defer.

### 4. Defer (or Draft)
**When**: Email needs a thoughtful response but isn't urgent
**Tool**: `manage_drafts(action="create", subject="Re: ...", to="...", body="[your draft]")`
**Examples**:
- Complex questions requiring research
- Emotional emails needing careful wording
- Proposals that need detailed responses
- Decisions requiring consultation with others

**Workflow**:
1. Create draft with initial thoughts
2. Schedule dedicated time to complete drafts (e.g., Friday afternoon)
3. Review drafts weekly to avoid accumulation

**Alternative**: Flag the email and set a reminder if you don't want to start a draft yet:
`update_email_status(action="flag", subject_keyword="...")`

### 5. Do (or Act)
**When**: Email requires action (not just a reply) that takes under 2 minutes
**Examples**:
- Calendar invites → Accept/decline
- Simple file downloads → Download attachment
- Quick updates → Update a document
- Short tasks → Complete immediately

**For downloads**:
```
list_email_attachments(subject_keyword="...")
save_email_attachment(attachment_name="...", save_path="...")
```

## Complete Inbox Zero Workflow

### Morning Routine (15-30 minutes)

**Step 1: Get Overview**
```
get_inbox_overview()
```
- Review unread count
- Note any urgent senders
- Identify patterns (lots from one person?)

**Step 2: Process Urgent First**
```
search_emails(subject_keyword="urgent", read_status="unread")
search_emails(subject_keyword="action required", read_status="unread")
```
- Handle time-sensitive emails first
- Quick responses or forwards
- Flag if needs more time

**Step 3: Process Top-Down (Newest First)**
For each email, apply the 5 D's:

1. **Quick Scan**: Subject and sender
2. **Decision**: Which of the 5 actions?
3. **Execute**: Use appropriate tool
4. **Archive or File**: `move_email(to_mailbox="Archive")` or specific folder

**Step 4: Review Flagged Items**
```
search_emails(mailbox="All", read_status="all")  # Look for flags
```
- Check items you flagged earlier
- Take action if ready
- Re-flag if still pending

**Step 5: Celebrate Zero**
When inbox is empty (or contains only flagged future items), you're done!

### Midday Check (5-10 minutes)

**Quick Triage**:
```
get_recent_emails(count=20)
```
- Process new arrivals
- Quick wins (delete, respond)
- Flag or defer complex items

### End of Day Review (10-15 minutes)

**Final Cleanup**:
1. Process any remaining emails
2. Review drafts: `manage_drafts(action="list")`
3. Check flagged items: Are they still relevant?
4. Move read emails to Archive if not filed

## Folder Structure for Inbox Zero

**Minimal Approach** (Recommended):
```
Inbox (empty or near-empty)
├── Action Required (flagged items only)
├── Waiting For (delegated items)
└── Archive (everything else)
```

**Projects Approach**:
```
Inbox (empty)
├── Action Required
├── Waiting For
├── Projects/
│   ├── Project A
│   ├── Project B
│   └── Project C
└── Archive
```

**Key Point**: Don't over-organize. You can always search. Simple structure is easier to maintain.

## Common Obstacles & Solutions

### "I get too many emails to process daily"
**Solution**:
1. Unsubscribe from newsletters: `get_statistics(scope="account_overview")` to see top senders
2. Set up filters in Mail app for auto-filing
3. Process in batches: `search_emails(sender="newsletter.com")` → bulk trash
4. Delegate more: Forward emails that others can handle

### "I'm afraid to delete emails"
**Solution**:
1. Remember: Delete isn't permanent immediately (goes to Trash)
2. Export important mailboxes first: `export_emails(scope="entire_mailbox", mailbox="Important")`
3. Archive instead of delete if uncertain
4. Trust that you can search for 99% of emails you might need

### "I keep flagging but never process flagged items"
**Solution**:
1. Schedule dedicated "Flagged Items" time (e.g., Friday 2-3pm)
2. Limit flags: `search_emails()` + review - are all flags still relevant?
3. Use drafts for action items, flags only for time-sensitive reminders
4. Consider: If flagged for >2 weeks, it might not be important

### "Emails require more than 2 minutes but I don't want to defer everything"
**Solution**:
1. The 2-minute rule is a guideline, not law
2. Extend to 5 minutes for slightly longer tasks
3. Batch similar emails: Respond to multiple related emails together
4. Use templates: Create draft templates for common responses

### "I process to zero but it fills up again immediately"
**Solution**:
1. Set email checking schedule (e.g., 9am, 12pm, 3pm, 5pm)
2. Turn off notifications
3. Batch process, don't trickle process
4. Accept that inbox zero is a snapshot, not a permanent state

## Maintenance

### Daily (15-30 min)
- Process inbox to zero
- Review flagged items
- Complete quick drafts

### Weekly (30-60 min)
- Review all drafts: `manage_drafts(action="list")`
- Clean up flagged items that are no longer relevant
- Archive old emails from project folders
- Review statistics to identify optimization opportunities

### Monthly (1-2 hours)
- Deep clean: `get_statistics()` to analyze patterns
- Unsubscribe from unused newsletters
- Review folder structure effectiveness
- Export/backup important mailboxes

## Success Metrics

Track these to measure success:

1. **Unread Count**: Target: 0 daily
   ```
   get_unread_count()
   ```

2. **Processing Time**: Target: <30 min/day
   - Time how long morning routine takes
   - Should decrease as habits form

3. **Flag Accumulation**: Target: <10 flagged items
   ```
   search_emails()  # Check flags
   ```

4. **Draft Accumulation**: Target: <5 active drafts
   ```
   manage_drafts(action="list")
   ```

5. **Email Volume**: Use statistics to track trends
   ```
   get_statistics(scope="account_overview", days_back=30)
   ```

## Advanced Tips

1. **Batch by Sender**: Group emails from the same person and process together
   ```
   search_emails(sender="person@example.com", read_status="unread")
   ```

2. **Time-Box Processing**: Set a timer for 25 minutes (Pomodoro technique)

3. **Keyboard Shortcuts**: Learn Mail app shortcuts for faster processing

4. **Templates**: Create drafts for common response types

5. **Smart Folders**: Set up Mail smart folders for auto-organization (external to MCP)

6. **Early Morning Processing**: Process inbox first thing before new emails arrive

## Remember

- **Perfect is the enemy of good**: Better to process emails imperfectly than let them pile up
- **It's a practice, not a destination**: Inbox zero is something you do daily, not achieve once
- **Adapt to your style**: Modify this workflow to fit your work patterns
- **Be patient**: It takes 2-3 weeks to form the habit

## Quick Reference Commands

| Action | Command |
|--------|---------|
| Get overview | `get_inbox_overview()` |
| Check urgent | `search_emails(subject_keyword="urgent")` |
| Quick reply | `reply_to_email(reply_body="...", subject_keyword="...")` |
| Create draft | `manage_drafts(action="create", ...)` |
| Move to trash | `manage_trash(action="move_to_trash", ...)` |
| Archive | `move_email(to_mailbox="Archive", ...)` |
| Flag for later | `update_email_status(action="flag", ...)` |
| List drafts | `manage_drafts(action="list")` |
| Search all | `search_emails(mailbox="All", ...)` |

---

**Start Today**: Process your inbox to zero right now. Even if it takes 2 hours, it's worth it. Then maintain daily.
