# Common Email Workflows - Quick Reference

This document provides ready-to-use workflow templates for common email management tasks. Copy and adapt these patterns to your specific needs.

## Quick Triage Workflows

### Morning Inbox Check (10 minutes)

```
# 1. Get overview
get_inbox_overview()

# 2. Check urgent items
search_emails(subject_keyword="urgent", read_status="unread")
search_emails(subject_keyword="ASAP", read_status="unread")

# 3. Check VIP senders
search_emails(sender="boss@company.com", read_status="unread")
search_emails(sender="key-client@example.com", read_status="unread")

# 4. Flag action items
update_email_status(action="flag", subject_keyword="action required", max_updates=5)

# 5. Quick cleanup
manage_trash(action="move_to_trash", sender="newsletter@", mailbox="INBOX", max_deletes=10)
```

### End of Day Cleanup (5 minutes)

```
# 1. Check unread count
get_unread_count()

# 2. Quick scan recent
get_recent_emails(count=20, include_content=False)

# 3. Mark read non-essential
update_email_status(action="mark_read", sender="automated@", mailbox="INBOX", max_updates=10)

# 4. Archive processed emails
move_email(to_mailbox="Archive", from_mailbox="INBOX", max_moves=20)

# 5. Review flagged items for tomorrow
search_emails(mailbox="All")  # Check flags
```

## Search & Find Workflows

### Find Specific Email Thread

```
# Option 1: Search by subject
get_email_with_content(
    account="Work",
    subject_keyword="Project Alpha",
    max_results=5,
    max_content_length=300
)

# Option 2: Get full thread
get_email_thread(
    account="Work",
    subject_keyword="Project Alpha",
    mailbox="All",
    max_messages=20
)

# Option 3: Advanced search
search_emails(
    account="Work",
    mailbox="All",
    subject_keyword="Project Alpha",
    sender="client@example.com",
    include_content=True,
    max_results=10
)
```

### Find Emails from Specific Person

```
# All emails from sender
search_emails(
    account="Work",
    sender="colleague@company.com",
    mailbox="All",
    max_results=50
)

# Unread emails from sender
search_emails(
    account="Work",
    sender="colleague@company.com",
    read_status="unread",
    mailbox="INBOX"
)

# Emails with attachments from sender
search_emails(
    account="Work",
    sender="colleague@company.com",
    has_attachments=True,
    mailbox="All",
    max_results=20
)
```

### Find Emails by Date Range

```
# Emails from last month
search_emails(
    account="Work",
    date_from="2025-01-01",
    date_to="2025-01-31",
    mailbox="All",
    max_results=100
)

# Recent emails with keyword
search_emails(
    account="Work",
    subject_keyword="invoice",
    date_from="2025-01-15",
    mailbox="All",
    max_results=20
)
```

### Find Emails with Attachments

```
# All emails with attachments
search_emails(
    account="Work",
    has_attachments=True,
    mailbox="INBOX",
    max_results=50
)

# Specific sender with attachments
search_emails(
    account="Work",
    sender="supplier@example.com",
    has_attachments=True,
    mailbox="All",
    max_results=20
)

# Then list attachments
list_email_attachments(
    account="Work",
    subject_keyword="Invoice",
    max_results=1
)

# Save specific attachment
save_email_attachment(
    account="Work",
    subject_keyword="Invoice",
    attachment_name="invoice.pdf",
    save_path="~/Desktop/invoice.pdf"
)
```

## Organization Workflows

### Daily Filing Routine

```
# 1. File project emails
search_emails(
    account="Work",
    subject_keyword="Project Alpha",
    mailbox="INBOX",
    read_status="all"
)

move_email(
    account="Work",
    subject_keyword="Project Alpha",
    to_mailbox="Projects/Alpha",
    from_mailbox="INBOX",
    max_moves=10
)

# 2. File client emails
search_emails(
    account="Work",
    sender="client@example.com",
    mailbox="INBOX"
)

move_email(
    account="Work",
    sender="client@example.com",  # Need to use subject_keyword with search result
    to_mailbox="Clients/ClientName",
    from_mailbox="INBOX",
    max_moves=10
)

# 3. Archive everything else
move_email(
    account="Work",
    subject_keyword="",  # Match all
    to_mailbox="Archive",
    from_mailbox="INBOX",
    max_moves=20
)
```

### Bulk Folder Organization

```
# 1. Review current structure
list_mailboxes(account="Work", include_counts=True)

# 2. Identify emails to organize
get_statistics(
    account="Work",
    scope="account_overview",
    days_back=30
)

# 3. Batch move by pattern
# Example: Move all emails from a client
search_emails(
    account="Work",
    sender="bigclient@example.com",
    mailbox="All",
    max_results=50
)

# Then move them (repeat with batches if >10)
move_email(
    account="Work",
    subject_keyword="[pattern from search]",
    to_mailbox="Clients/BigClient",
    from_mailbox="INBOX",
    max_moves=10
)
```

### Archive Old Emails

```
# 1. Find old read emails
search_emails(
    account="Work",
    date_to="2024-12-31",
    read_status="read",
    mailbox="INBOX",
    max_results=50
)

# 2. Review what you found
# (Check if any need to be kept in current folders)

# 3. Export if important
export_emails(
    account="Work",
    scope="single_email",
    subject_keyword="Important Old Email",
    mailbox="INBOX",
    save_directory="~/Documents/Email-Archives",
    format="txt"
)

# 4. Move to archive
move_email(
    account="Work",
    subject_keyword="[pattern]",
    to_mailbox="Archive/2024",
    from_mailbox="INBOX",
    max_moves=20
)
```

## Response Workflows

### Quick Reply

```
# 1. Find the email
get_email_with_content(
    account="Work",
    subject_keyword="Quick Question",
    max_results=1,
    max_content_length=300
)

# 2. Reply immediately
reply_to_email(
    account="Work",
    subject_keyword="Quick Question",
    reply_body="Yes, that works for me. Thanks!",
    reply_to_all=False
)

# 3. Archive the thread
move_email(
    account="Work",
    subject_keyword="Quick Question",
    to_mailbox="Archive",
    from_mailbox="INBOX",
    max_moves=1
)
```

### Deferred Response (Draft)

```
# 1. Review email content
get_email_with_content(
    account="Work",
    subject_keyword="Complex Request",
    max_results=1,
    max_content_length=500
)

# 2. Create draft for later
manage_drafts(
    account="Work",
    action="create",
    subject="Re: Complex Request",
    to="sender@example.com",
    body="Thank you for your email. I'm reviewing your request and will provide a detailed response by [date].\n\n[Draft notes: Need to check with team, review budget, etc.]"
)

# 3. Flag original email
update_email_status(
    account="Work",
    action="flag",
    subject_keyword="Complex Request",
    mailbox="INBOX",
    max_updates=1
)
```

### Reply to All in Thread

```
# 1. View full thread context
get_email_thread(
    account="Work",
    subject_keyword="Team Discussion",
    mailbox="All",
    max_messages=20
)

# 2. Reply to all
reply_to_email(
    account="Work",
    subject_keyword="Team Discussion",
    reply_body="Based on the discussion, I agree with the proposal. Let's move forward.",
    reply_to_all=True
)
```

### Forward with Context

```
# 1. Find the email
get_email_with_content(
    account="Work",
    subject_keyword="Customer Issue",
    max_results=1,
    max_content_length=500
)

# 2. Forward to colleague
forward_email(
    account="Work",
    subject_keyword="Customer Issue",
    to="colleague@company.com",
    message="Hi [Name],\n\nCan you please help with this customer issue? It seems related to your area.\n\nThanks!",
    mailbox="INBOX"
)

# 3. Update status and move
update_email_status(
    account="Work",
    action="mark_read",
    subject_keyword="Customer Issue",
    mailbox="INBOX",
    max_updates=1
)

move_email(
    account="Work",
    subject_keyword="Customer Issue",
    to_mailbox="Waiting For",
    from_mailbox="INBOX",
    max_moves=1
)
```

## Cleanup Workflows

### Delete Spam and Newsletters

```
# 1. Identify unwanted senders
get_statistics(
    account="Personal",
    scope="account_overview",
    days_back=30
)
# Look for frequent senders you don't read

# 2. Search for their emails
search_emails(
    account="Personal",
    sender="newsletter@unwanted.com",
    mailbox="INBOX",
    max_results=50
)

# 3. Bulk delete (move to trash first - reversible)
manage_trash(
    account="Personal",
    action="move_to_trash",
    sender="newsletter@unwanted.com",
    mailbox="INBOX",
    max_deletes=20
)

# 4. Verify trash
search_emails(
    account="Personal",
    sender="newsletter@unwanted.com",
    mailbox="Trash"
)

# 5. Permanently delete if confirmed (optional)
manage_trash(
    account="Personal",
    action="delete_permanent",
    sender="newsletter@unwanted.com",
    max_deletes=20
)
```

### Clean Up Old Emails

```
# 1. Find emails older than 90 days
search_emails(
    account="Work",
    date_to="2024-10-01",
    read_status="read",
    mailbox="INBOX",
    max_results=50
)

# 2. Export important ones first (if needed)
export_emails(
    account="Work",
    scope="entire_mailbox",
    mailbox="INBOX",
    save_directory="~/Documents/Email-Backup",
    format="txt"
)

# 3. Move to archive or delete
move_email(
    account="Work",
    subject_keyword="[pattern]",
    to_mailbox="Archive/2024",
    from_mailbox="INBOX",
    max_moves=20
)
```

### Empty Trash

```
# 1. Review what's in trash first
search_emails(
    account="Work",
    mailbox="Trash",
    max_results=20
)

# 2. Export if anything important
export_emails(
    account="Work",
    scope="entire_mailbox",
    mailbox="Trash",
    save_directory="~/Desktop/Trash-Backup"
)

# 3. Empty trash (CAREFUL - irreversible)
manage_trash(
    account="Work",
    action="empty_trash"
)
```

## Draft Management Workflows

### Weekly Draft Review

```
# 1. List all drafts
manage_drafts(
    account="Work",
    action="list"
)

# 2. Send completed drafts
manage_drafts(
    account="Work",
    action="send",
    draft_subject="Ready to Send Draft"
)

# 3. Delete outdated drafts
manage_drafts(
    account="Work",
    action="delete",
    draft_subject="Old Draft from Last Month"
)

# 4. Edit others (do in Mail app)
```

### Create Draft for Complex Email

```
# 1. Review context
get_email_thread(
    account="Work",
    subject_keyword="Complex Topic",
    mailbox="All"
)

# 2. Create draft with initial thoughts
manage_drafts(
    account="Work",
    action="create",
    subject="Re: Complex Topic - My Analysis",
    to="stakeholder@company.com",
    cc="team@company.com",
    body="[Draft - Need to expand]\n\n1. Summary of situation\n2. Analysis\n3. Recommendation\n\n[Notes to self: Check data, consult with team]"
)

# 3. Schedule time to complete
# (Set calendar reminder to finish draft)
```

## Analysis Workflows

### Weekly Email Analytics

```
# 1. Get account overview
get_statistics(
    account="Work",
    scope="account_overview",
    days_back=7
)

# 2. Analyze top senders
# (Use sender names from overview)
get_statistics(
    account="Work",
    scope="sender_stats",
    sender="frequent-sender@example.com",
    days_back=30
)

# 3. Check mailbox distribution
list_mailboxes(
    account="Work",
    include_counts=True
)

# 4. Review unread counts
get_unread_count()

# 5. Identify actions:
# - Unsubscribe from high-volume, low-value senders
# - Create folders for frequent senders
# - Archive/delete old emails in cluttered folders
```

### Sender Analysis and Action

```
# 1. Get sender statistics
get_statistics(
    account="Work",
    scope="sender_stats",
    sender="automated-reports@company.com",
    days_back=90
)

# 2. If too many emails, decide action:
#    Option A: Create filter (in Mail app)
#    Option B: Move to dedicated folder
#    Option C: Unsubscribe

# 3. Organize existing emails
search_emails(
    account="Work",
    sender="automated-reports@company.com",
    mailbox="All",
    max_results=50
)

move_email(
    account="Work",
    subject_keyword="[pattern]",
    to_mailbox="Automated Reports",
    from_mailbox="INBOX",
    max_moves=20
)
```

## Batch Operation Workflows

### Flag Multiple Emails for Review

```
# 1. Search for pattern
search_emails(
    account="Work",
    subject_keyword="Q4 Review",
    mailbox="All",
    max_results=20
)

# 2. Batch flag
update_email_status(
    account="Work",
    action="flag",
    subject_keyword="Q4 Review",
    mailbox="All",
    max_updates=10
)
```

### Mark Multiple Emails as Read

```
# 1. Identify emails to mark read
search_emails(
    account="Work",
    sender="automated-notifications@",
    read_status="unread",
    mailbox="INBOX",
    max_results=20
)

# 2. Batch mark as read
update_email_status(
    account="Work",
    action="mark_read",
    sender="automated-notifications@",
    mailbox="INBOX",
    max_updates=20
)
```

### Bulk Move by Sender

```
# 1. Find all emails from sender
search_emails(
    account="Work",
    sender="project-team@company.com",
    mailbox="INBOX",
    max_results=50
)

# 2. Move in batches (max_moves=10 is safe)
move_email(
    account="Work",
    subject_keyword="",  # Use pattern from search
    to_mailbox="Projects/Team Project",
    from_mailbox="INBOX",
    max_moves=10
)

# 3. Repeat if more than 10 emails
# (Run the move_email command again)
```

## Backup and Export Workflows

### Export Important Mailbox

```
# 1. Check mailbox contents
search_emails(
    account="Work",
    mailbox="Important Project",
    max_results=20
)

# 2. Export entire mailbox
export_emails(
    account="Work",
    scope="entire_mailbox",
    mailbox="Important Project",
    save_directory="~/Documents/Email-Backups/Important-Project",
    format="txt"
)

# 3. Verify export
# (Check ~/Documents/Email-Backups/Important-Project directory)
```

### Export Single Important Email

```
# 1. Find the email
get_email_with_content(
    account="Work",
    subject_keyword="Contract Agreement",
    max_results=1,
    max_content_length=0  # Full content
)

# 2. Export with attachments
list_email_attachments(
    account="Work",
    subject_keyword="Contract Agreement"
)

save_email_attachment(
    account="Work",
    subject_keyword="Contract Agreement",
    attachment_name="contract.pdf",
    save_path="~/Documents/Contracts/contract.pdf"
)

# 3. Export email text
export_emails(
    account="Work",
    scope="single_email",
    subject_keyword="Contract Agreement",
    save_directory="~/Documents/Contracts",
    format="html"
)
```

## Weekly Maintenance Workflow

```
# Monday Morning (30 min)

# 1. Review weekend emails
get_inbox_overview()

# 2. Triage urgent items
search_emails(subject_keyword="urgent", read_status="unread")
search_emails(subject_keyword="action required", read_status="unread")

# 3. Process inbox to zero
# (Use inbox zero workflow)

# 4. Review weekly tasks
search_emails(mailbox="All")  # Check flags

# 5. Set up for the week
manage_drafts(action="list")
```

```
# Friday Afternoon (30 min)

# 1. Complete pending replies
manage_drafts(action="list")
# Send or delete drafts

# 2. Clean up flagged items
search_emails(mailbox="All")  # Review flags
update_email_status(action="unflag", ...)  # Clear completed

# 3. Archive week's emails
move_email(to_mailbox="Archive", from_mailbox="INBOX", max_moves=50)

# 4. Review statistics
get_statistics(scope="account_overview", days_back=7)

# 5. Plan for next week
# Note patterns, senders to filter, folders to create
```

## Tips for Using These Workflows

1. **Copy and adapt**: These are templates - adjust parameters for your needs
2. **Chain commands**: Run multiple commands in sequence for complex workflows
3. **Use max limits**: Always respect max_moves, max_deletes safety limits
4. **Review before deleting**: Always search first, then delete
5. **Export before cleanup**: Backup important emails before bulk operations
6. **Start small**: Test with small max values (5-10) before increasing

## Quick Reference: Most Common Commands

```
# Daily essentials
get_inbox_overview()
get_recent_emails(count=20)
search_emails(subject_keyword="...", mailbox="All")
reply_to_email(subject_keyword="...", reply_body="...")
move_email(to_mailbox="Archive", from_mailbox="INBOX", max_moves=10)

# Weekly maintenance
list_mailboxes(include_counts=True)
manage_drafts(action="list")
get_statistics(scope="account_overview", days_back=7)
update_email_status(action="flag" or "mark_read", ...)

# Cleanup operations
manage_trash(action="move_to_trash", ...)
export_emails(scope="entire_mailbox", mailbox="...", ...)
```

---

**Remember**: These workflows are starting points. Adapt them to your specific email patterns and work style.
