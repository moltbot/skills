# Email Search Patterns Reference

This document provides a comprehensive reference for search patterns using the Apple Mail MCP. Master these patterns to find any email quickly.

## Basic Search Tools

The MCP provides three main search tools:

1. **`get_email_with_content()`** - Best for quick subject searches with content preview
2. **`search_emails()`** - Best for advanced filtering with multiple criteria
3. **`get_email_thread()`** - Best for viewing conversation threads

## Search Pattern Cheat Sheet

### By Subject

```python
# Simple subject search (fast, with content)
get_email_with_content(
    account="Work",
    subject_keyword="meeting",
    max_results=5,
    max_content_length=300
)

# Advanced subject search (more filtering options)
search_emails(
    account="Work",
    subject_keyword="meeting",
    mailbox="INBOX",
    max_results=20
)

# Case-insensitive automatic
# Both "MEETING", "Meeting", and "meeting" will match
```

### By Sender

```python
# All emails from a sender
search_emails(
    account="Work",
    sender="colleague@company.com",
    mailbox="All",
    max_results=50
)

# Partial sender matching
search_emails(
    account="Work",
    sender="@company.com",  # All from company domain
    mailbox="All"
)

# Sender + subject
search_emails(
    account="Work",
    sender="boss@company.com",
    subject_keyword="review",
    mailbox="All"
)
```

### By Date Range

```python
# Emails from specific period
search_emails(
    account="Work",
    date_from="2025-01-01",
    date_to="2025-01-31",
    mailbox="All",
    max_results=100
)

# Recent emails (last 7 days)
search_emails(
    account="Work",
    date_from="2025-01-09",  # 7 days ago
    mailbox="All"
)

# Old emails (before specific date)
search_emails(
    account="Work",
    date_to="2024-12-31",
    read_status="read",
    mailbox="INBOX"
)
```

### By Read Status

```python
# Unread emails only
search_emails(
    account="Work",
    read_status="unread",
    mailbox="INBOX",
    max_results=50
)

# Read emails only
search_emails(
    account="Work",
    read_status="read",
    mailbox="INBOX",
    max_results=50
)

# All emails (read and unread)
search_emails(
    account="Work",
    read_status="all",
    mailbox="INBOX"
)
```

### By Attachment Status

```python
# Emails with attachments
search_emails(
    account="Work",
    has_attachments=True,
    mailbox="INBOX",
    max_results=20
)

# Emails without attachments
search_emails(
    account="Work",
    has_attachments=False,
    mailbox="INBOX"
)

# With attachments from specific sender
search_emails(
    account="Work",
    sender="vendor@example.com",
    has_attachments=True,
    mailbox="All"
)
```

### By Mailbox/Folder

```python
# Search in specific mailbox
search_emails(
    account="Work",
    mailbox="Projects/Alpha",
    subject_keyword="update"
)

# Search across all mailboxes
search_emails(
    account="Work",
    mailbox="All",
    subject_keyword="important"
)

# Search in inbox only (default)
search_emails(
    account="Work",
    mailbox="INBOX",
    subject_keyword="todo"
)
```

## Advanced Search Patterns

### Multi-Criteria Searches

```python
# Unread emails with attachments from specific sender
search_emails(
    account="Work",
    sender="client@example.com",
    has_attachments=True,
    read_status="unread",
    mailbox="All",
    max_results=20
)

# Recent important emails
search_emails(
    account="Work",
    subject_keyword="urgent",
    date_from="2025-01-01",
    read_status="unread",
    mailbox="INBOX"
)

# Old read emails with attachments (for cleanup)
search_emails(
    account="Work",
    date_to="2024-06-30",
    has_attachments=True,
    read_status="read",
    mailbox="All",
    max_results=100
)
```

### Thread Searches

```python
# Get full conversation thread
get_email_thread(
    account="Work",
    subject_keyword="Project Discussion",
    mailbox="All",
    max_messages=50
)

# Thread from specific mailbox
get_email_thread(
    account="Work",
    subject_keyword="Client Meeting",
    mailbox="Clients/ClientName"
)

# Note: Thread search automatically handles "Re:" and "Fwd:" prefixes
```

### Content Preview Searches

```python
# Quick preview (300 chars)
search_emails(
    account="Work",
    subject_keyword="proposal",
    include_content=True,
    mailbox="All",
    max_results=5
)

# Full content preview
get_email_with_content(
    account="Work",
    subject_keyword="contract",
    max_content_length=0,  # 0 = unlimited
    max_results=1
)

# Long preview (1000 chars)
get_email_with_content(
    account="Work",
    subject_keyword="requirements",
    max_content_length=1000,
    max_results=3
)
```

## Common Search Scenarios

### Finding Urgent/Priority Emails

```python
# Urgent keyword searches
search_emails(account="Work", subject_keyword="urgent", read_status="unread")
search_emails(account="Work", subject_keyword="ASAP", read_status="unread")
search_emails(account="Work", subject_keyword="immediate", read_status="unread")
search_emails(account="Work", subject_keyword="deadline", mailbox="All")
search_emails(account="Work", subject_keyword="action required", read_status="unread")

# From important people
search_emails(account="Work", sender="boss@company.com", read_status="unread")
search_emails(account="Work", sender="ceo@company.com", mailbox="All")
search_emails(account="Work", sender="key-client@", read_status="unread")
```

### Finding Specific Documents/Attachments

```python
# Invoices
search_emails(
    account="Work",
    subject_keyword="invoice",
    has_attachments=True,
    mailbox="All",
    max_results=50
)

# Contracts
search_emails(
    account="Work",
    subject_keyword="contract",
    has_attachments=True,
    sender="legal@"
)

# Reports
search_emails(
    account="Work",
    subject_keyword="report",
    has_attachments=True,
    date_from="2025-01-01"
)

# Then list and download
list_email_attachments(
    account="Work",
    subject_keyword="invoice"
)

save_email_attachment(
    account="Work",
    subject_keyword="invoice",
    attachment_name="invoice.pdf",
    save_path="~/Desktop/invoice.pdf"
)
```

### Finding Automated/System Emails

```python
# No-reply emails
search_emails(
    account="Work",
    sender="no-reply@",
    mailbox="INBOX",
    max_results=50
)

search_emails(
    account="Work",
    sender="noreply@",
    mailbox="INBOX"
)

# Automated notifications
search_emails(
    account="Work",
    sender="notifications@",
    mailbox="All"
)

search_emails(
    account="Work",
    subject_keyword="[Automated]",
    mailbox="INBOX"
)

# Newsletters (for unsubscribe candidates)
search_emails(
    account="Personal",
    subject_keyword="unsubscribe",
    read_status="unread",
    max_results=50
)
```

### Finding Project/Client Emails

```python
# By project name in subject
search_emails(
    account="Work",
    subject_keyword="Project Alpha",
    mailbox="All",
    max_results=100
)

# By client domain
search_emails(
    account="Work",
    sender="@clientdomain.com",
    mailbox="All",
    max_results=50
)

# Project + timeframe
search_emails(
    account="Work",
    subject_keyword="Project Alpha",
    date_from="2025-01-01",
    date_to="2025-03-31",
    mailbox="All"
)

# Project + unread
search_emails(
    account="Work",
    subject_keyword="Project Alpha",
    read_status="unread",
    mailbox="All"
)
```

### Finding Old Emails for Cleanup

```python
# Old read emails (>90 days)
search_emails(
    account="Work",
    date_to="2024-10-01",
    read_status="read",
    mailbox="INBOX",
    max_results=100
)

# Old emails with attachments (storage cleanup)
search_emails(
    account="Work",
    date_to="2024-01-01",
    has_attachments=True,
    mailbox="All",
    max_results=100
)

# Old unread (probably not important)
search_emails(
    account="Work",
    date_to="2024-12-01",
    read_status="unread",
    mailbox="INBOX"
)
```

### Finding Emails Needing Action

```python
# Action-related keywords
search_emails(account="Work", subject_keyword="action required", read_status="unread")
search_emails(account="Work", subject_keyword="please review", read_status="unread")
search_emails(account="Work", subject_keyword="waiting for", mailbox="All")
search_emails(account="Work", subject_keyword="pending", read_status="unread")
search_emails(account="Work", subject_keyword="approval", read_status="unread")
search_emails(account="Work", subject_keyword="sign off", read_status="unread")
search_emails(account="Work", subject_keyword="feedback needed", read_status="unread")
```

### Finding Meeting/Calendar Related

```python
# Meeting invites
search_emails(
    account="Work",
    subject_keyword="meeting",
    mailbox="INBOX"
)

# Calendar invites
search_emails(
    account="Work",
    subject_keyword="invitation",
    date_from="2025-01-15"
)

# Accepted meetings
search_emails(
    account="Work",
    subject_keyword="Accepted:",
    mailbox="All"
)

# Meeting agendas
search_emails(
    account="Work",
    subject_keyword="agenda",
    has_attachments=True
)
```

## Search Optimization Tips

### 1. Start Broad, Then Narrow

```python
# Step 1: Broad search
search_emails(
    account="Work",
    subject_keyword="project",
    mailbox="All",
    max_results=20
)

# Step 2: Add filters based on results
search_emails(
    account="Work",
    subject_keyword="project",
    sender="client@example.com",
    date_from="2025-01-01",
    mailbox="All"
)
```

### 2. Use Mailbox="All" When Location Unknown

```python
# Don't know where it is? Search everywhere
search_emails(
    account="Work",
    subject_keyword="rare email",
    mailbox="All",
    max_results=50
)
```

### 3. Combine Multiple Searches for OR Logic

```python
# Want emails matching "urgent" OR "ASAP"?
# Run two searches:

urgent_results = search_emails(
    account="Work",
    subject_keyword="urgent",
    read_status="unread"
)

asap_results = search_emails(
    account="Work",
    subject_keyword="ASAP",
    read_status="unread"
)

# Then combine results
```

### 4. Use Partial Matches

```python
# Partial subject (finds "invoice 123", "invoice-2025", etc.)
search_emails(
    account="Work",
    subject_keyword="invoice",
    mailbox="All"
)

# Partial sender (all Gmail addresses)
search_emails(
    account="Work",
    sender="@gmail.com",
    mailbox="All"
)

# Partial domain (all company emails)
search_emails(
    account="Work",
    sender="@company.com",
    mailbox="All"
)
```

### 5. Preview Content Sparingly

```python
# Fast search (no content)
search_emails(
    account="Work",
    subject_keyword="project",
    include_content=False,  # Default, fastest
    max_results=50
)

# Slower search (with content preview)
search_emails(
    account="Work",
    subject_keyword="project",
    include_content=True,  # Slower, shows previews
    max_results=10  # Limit results when including content
)
```

## Special Search Techniques

### Finding Emails You Sent

```python
# Note: MCP searches received emails only
# To find sent emails, search in "Sent" mailbox
search_emails(
    account="Work",
    mailbox="Sent",
    subject_keyword="proposal",
    max_results=20
)
```

### Finding CCs/BCCs

```python
# Search where you might be CC'd
search_emails(
    account="Work",
    subject_keyword="FYI",
    mailbox="All"
)

# Or look for typical CC patterns
search_emails(
    account="Work",
    subject_keyword="CC:",
    mailbox="All"
)
```

### Finding Drafts

```python
# List all drafts
manage_drafts(
    account="Work",
    action="list"
)

# Search specific draft
manage_drafts(
    account="Work",
    action="send",
    draft_subject="keyword"
)
```

### Fuzzy Matching

```python
# Use partial keywords for fuzzy matching
# Instead of exact "Project Alpha Phase 2"
search_emails(
    account="Work",
    subject_keyword="Alpha",  # Matches any email with "Alpha"
    mailbox="All"
)

# Or combine multiple searches for different spellings
search_emails(account="Work", subject_keyword="project alpha")
search_emails(account="Work", subject_keyword="proj alpha")
search_emails(account="Work", subject_keyword="alpha project")
```

## Search Result Management

### Understanding Max Results

```python
# Small searches (quick checks)
search_emails(..., max_results=5)

# Medium searches (normal use)
search_emails(..., max_results=20)  # Default

# Large searches (comprehensive)
search_emails(..., max_results=100)

# Note: If you get max_results back, there might be more
# Run search again with higher limit or add more filters
```

### Handling Large Result Sets

```python
# Step 1: Count results with limited search
initial_search = search_emails(
    account="Work",
    subject_keyword="newsletter",
    mailbox="INBOX",
    max_results=20
)
# If returns 20, there are likely more

# Step 2: Add filters to narrow
filtered_search = search_emails(
    account="Work",
    subject_keyword="newsletter",
    date_from="2025-01-01",
    mailbox="INBOX",
    max_results=50
)

# Step 3: Process in batches
# Use move_email or update_email_status with max_moves/max_updates
```

## Search Troubleshooting

### "No Results Found"

**Try these**:

1. **Check spelling**: Subject searches are exact substring matches
   ```python
   # Try variations
   search_emails(subject_keyword="project")
   search_emails(subject_keyword="proj")
   search_emails(subject_keyword="Project")  # Case doesn't matter
   ```

2. **Expand mailbox**: Search all folders
   ```python
   search_emails(mailbox="All", ...)
   ```

3. **Remove filters**: Start with just subject
   ```python
   search_emails(subject_keyword="term", mailbox="All")
   ```

4. **Check account**: Verify correct account
   ```python
   list_accounts()  # See all accounts
   search_emails(account="CorrectName", ...)
   ```

### "Too Many Results"

**Try these**:

1. **Add sender filter**
   ```python
   search_emails(subject_keyword="meeting", sender="specific@person.com")
   ```

2. **Add date filter**
   ```python
   search_emails(subject_keyword="report", date_from="2025-01-01")
   ```

3. **Add read status filter**
   ```python
   search_emails(subject_keyword="update", read_status="unread")
   ```

4. **Search specific mailbox**
   ```python
   search_emails(subject_keyword="project", mailbox="Projects/Alpha")
   ```

### "Wrong Emails Returned"

**Try these**:

1. **Use more specific keywords**
   ```python
   # Instead of: subject_keyword="update"
   # Try: subject_keyword="status update"
   ```

2. **Combine filters**
   ```python
   search_emails(
       subject_keyword="invoice",
       sender="vendor@",
       has_attachments=True
   )
   ```

3. **Use thread search for conversations**
   ```python
   get_email_thread(subject_keyword="discussion topic")
   ```

## Quick Reference Table

| I Want To... | Use This |
|-------------|----------|
| Quick subject search | `get_email_with_content(subject_keyword="...")` |
| Advanced filtering | `search_emails(...)` |
| View conversation | `get_email_thread(subject_keyword="...")` |
| Find by sender | `search_emails(sender="...")` |
| Find by date | `search_emails(date_from="...", date_to="...")` |
| Find unread | `search_emails(read_status="unread")` |
| Find with attachments | `search_emails(has_attachments=True)` |
| Search all folders | `search_emails(mailbox="All")` |
| Get content preview | `search_emails(include_content=True)` or `get_email_with_content()` |
| Find sent emails | `search_emails(mailbox="Sent")` |
| Find drafts | `manage_drafts(action="list")` |

## Practice Searches

Try these common searches right now:

```python
# 1. What's urgent right now?
search_emails(account="Work", subject_keyword="urgent", read_status="unread")

# 2. What emails have I not read this week?
search_emails(account="Work", read_status="unread", date_from="2025-01-13")

# 3. What did my boss send me recently?
search_emails(account="Work", sender="boss@", date_from="2025-01-01")

# 4. Where are emails about Project X?
search_emails(account="Work", subject_keyword="Project X", mailbox="All")

# 5. What old emails can I clean up?
search_emails(account="Work", date_to="2024-06-30", read_status="read", max_results=50)
```

---

**Pro Tip**: Save your most common search patterns as comments in a note file for quick copy-paste access!
