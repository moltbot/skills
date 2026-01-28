# Email Folder Organization Guide

Organizing emails into folders (mailboxes) is a balance between structure and simplicity. Too many folders becomes unmanageable; too few makes finding emails difficult. This guide helps you find the right balance.

## Core Philosophy

### The Search vs. Sort Debate

**Search-First Approach** (Recommended):
- Minimal folder structure
- Rely on powerful search tools
- Faster daily processing
- Works best with: Good search tools (like Apple Mail MCP)

**Sort-First Approach**:
- Detailed folder hierarchy
- Everything has a place
- Visual organization
- Works best with: Predictable email patterns

**This guide recommends**: 80% search, 20% folders. Use folders for active work, search for archives.

## Folder Organization Principles

### 1. Keep It Simple
**Max 2-3 levels deep**
- Inbox
  - Projects
    - Project A
    - Project B
  - Clients
    - Client X

**Not this** (too complex):
- Inbox
  - Work
    - Projects
      - Active
        - High Priority
          - Project A
            - Emails
              - Urgent

### 2. Organize by Action, Not Source
**Good** (action-oriented):
- Action Required
- Waiting For
- Reference
- Archive

**Not ideal** (source-oriented):
- From Boss
- From Team
- From Clients

### 3. Use Consistent Naming
**Good**: Projects/ProjectName
**Bad**: ProjectName, Project-Name, project_name (mixed styles)

### 4. Archive Liberally
If you haven't looked at a folder in 30 days, archive it.

## Recommended Folder Structures

### Minimal Structure (Inbox Zero Style)

```
Inbox (always empty or near-empty)
├── Action Required (flagged items)
├── Waiting For (delegated items)
└── Archive (everything else)
```

**Benefits**:
- Simple to maintain
- Fast processing
- Minimal decisions

**Use when**:
- You value simplicity
- Your emails don't fall into clear categories
- You're comfortable with search

**Tools to use**:
```
# Review current structure
list_mailboxes(include_counts=True)

# Move to Archive after processing
move_email(to_mailbox="Archive", subject_keyword="...", max_moves=10)

# Find anything later with search
search_emails(mailbox="All", subject_keyword="...")
```

### Project-Based Structure

```
Inbox
├── Action Required
├── Waiting For
├── Projects/
│   ├── Project Alpha
│   ├── Project Beta
│   └── Project Gamma
├── Reference
└── Archive
```

**Benefits**:
- Clear project separation
- Easy to find project emails
- Good for focused work

**Use when**:
- You work on 3-10 distinct projects
- Projects are long-running (3+ months)
- You need to track project communication

**Setup workflow**:
```
# 1. Review current structure
list_mailboxes()

# 2. Create folders in Mail app (MCP doesn't create folders)
#    - Create "Projects" folder
#    - Create subfolders for each project

# 3. Move project emails
search_emails(subject_keyword="Project Alpha", mailbox="All")
move_email(to_mailbox="Projects/Project Alpha", subject_keyword="Project Alpha", max_moves=20)

# 4. Set up routine to file new project emails
#    (Do this during daily processing)
```

### Client/Customer Structure

```
Inbox
├── Action Required
├── Clients/
│   ├── Client A
│   ├── Client B
│   └── Client C
├── Internal
└── Archive
```

**Benefits**:
- Clear client separation
- Professional appearance
- Easy reporting

**Use when**:
- You manage 5-20 clients
- You need to review client communication history
- Billing/time tracking requires email records

**Setup workflow**:
```
# 1. Identify top clients
get_statistics(scope="account_overview")
# Look at "Top Senders" section

# 2. Create client folders in Mail app

# 3. Batch move by sender
search_emails(sender="contact@clienta.com", mailbox="All")
move_email(to_mailbox="Clients/Client A", sender="contact@clienta.com", max_moves=50)

# 4. Review and adjust
list_mailboxes(include_counts=True)
```

### GTD (Getting Things Done) Structure

```
Inbox
├── Next Actions (do soon)
├── Waiting For (delegated/blocked)
├── Someday/Maybe (future ideas)
├── Projects/ (active projects)
├── Reference (keep for later)
└── Archive (everything else)
```

**Benefits**:
- Matches GTD methodology
- Action-oriented
- Clear next steps

**Use when**:
- You follow GTD principles
- You need clear action lists
- You separate tasks from reference

### Time-Based Structure

```
Inbox
├── This Week
├── This Month
├── This Quarter
├── Archive/
│   ├── 2025
│   ├── 2024
│   └── 2023
```

**Benefits**:
- Temporal organization
- Easy to archive by year
- Good for audits/compliance

**Use when**:
- You need historical records
- Compliance requires dated archives
- You review emails by time period

## Setting Up Your Structure

### Step 1: Analyze Current Patterns

```
# Get overview
get_inbox_overview()

# Check statistics
get_statistics(scope="account_overview", days_back=90)

# Review current folders
list_mailboxes(include_counts=True)
```

**Ask yourself**:
- Who sends me the most emails? (Top senders)
- What are common topics? (Subject patterns)
- How are emails distributed? (Mailbox distribution)
- What folders do I actually use? (Check counts)

### Step 2: Design Structure

**Start minimal** and add folders only when needed:

1. **Essential folders** (everyone needs):
   - Archive (catch-all)

2. **Add if you use flagging**:
   - Action Required (flagged items)
   - Waiting For (delegated)

3. **Add if you have clear categories**:
   - Projects/ (if 3+ active projects)
   - Clients/ (if 5+ regular clients)
   - Teams/ (if working with multiple teams)

4. **Don't add**:
   - Folders "just in case"
   - Granular subcategories
   - Duplicate organization (e.g., by both sender and topic)

### Step 3: Create Folders

**Note**: The MCP doesn't create folders. Create them manually in Mail app:

1. Open Mail app
2. Right-click on account
3. Select "New Mailbox"
4. Create your structure
5. Verify with MCP: `list_mailboxes()`

### Step 4: Migrate Existing Emails

**Batch migration workflow**:

```
# 1. Identify emails to move
search_emails(subject_keyword="Project Alpha", mailbox="All")

# 2. Move in batches
move_email(
    to_mailbox="Projects/Project Alpha",
    subject_keyword="Project Alpha",
    from_mailbox="INBOX",
    max_moves=20
)

# 3. Verify
list_mailboxes(include_counts=True)

# 4. Repeat for other categories
```

**For sender-based migration**:
```
# Find all emails from a sender
search_emails(sender="client@example.com", mailbox="All", max_results=50)

# Move them
move_email(
    to_mailbox="Clients/Client Name",
    from_mailbox="INBOX",
    subject_keyword="",  # Empty = match all
    sender="client@example.com",  # Use search to identify first
    max_moves=20
)
```

### Step 5: Establish Routine

**Daily filing routine** (5-10 min):

```
# 1. Process inbox to zero (or near zero)

# 2. File emails into appropriate folders
#    - Project emails → Projects/[ProjectName]
#    - Client emails → Clients/[ClientName]
#    - Reference emails → Reference
#    - Everything else → Archive

# 3. Quick moves using keywords
move_email(to_mailbox="Projects/Alpha", subject_keyword="Alpha", max_moves=5)
move_email(to_mailbox="Clients/ClientA", subject_keyword="ClientA", max_moves=5)

# 4. Batch archive remaining
move_email(to_mailbox="Archive", from_mailbox="INBOX", max_moves=20)
```

## Maintaining Your Structure

### Weekly Maintenance (15 min)

```
# 1. Review folder counts
list_mailboxes(include_counts=True)

# 2. Check for bloat (folders with >100 emails)
#    - Consider: Do these need to be archived?

# 3. Review unused folders
#    - Delete or archive folders with 0 unread, <10 total

# 4. Archive old project folders
#    - Completed projects → Archive/Projects/[ProjectName]
```

### Monthly Maintenance (30 min)

```
# 1. Deep review
get_statistics(scope="account_overview", days_back=90)

# 2. Identify optimization opportunities
#    - Folders rarely used → consider removing
#    - Senders appearing frequently → consider dedicated folder

# 3. Archive inactive projects
#    - Move project folders to Archive if project is complete

# 4. Clean up old emails
#    - Export important mailboxes
export_emails(scope="entire_mailbox", mailbox="Important Project")
#    - Delete old emails from cluttered folders
```

### Quarterly Review (1 hour)

```
# 1. Full audit
list_mailboxes(include_counts=True)

# 2. Question every folder
#    - "Did I use this folder in the last 3 months?"
#    - If no → archive or delete

# 3. Simplify
#    - Merge similar folders
#    - Flatten deep hierarchies

# 4. Export archives
export_emails(scope="entire_mailbox", mailbox="Archive", format="txt")
```

## Common Organization Challenges

### "I have too many folders"

**Symptoms**:
- >20 top-level folders
- >3 levels deep
- Many folders with <5 emails
- Unsure where to file emails

**Solution**:
1. **Audit**: `list_mailboxes(include_counts=True)`
2. **Merge**: Combine similar folders
3. **Archive**: Move inactive folders to Archive
4. **Simplify**: Aim for <10 active folders

**Example cleanup**:
```
# Before: 30 folders, 5 levels deep
# After: 8 folders, 2 levels deep

Inbox
├── Action Required
├── Projects/
│   ├── Active/ (merged all active project folders)
│   └── Archive/ (moved completed projects here)
├── Reference
└── Archive
```

### "I never use my folders"

**Symptoms**:
- Folders created but never accessed
- Always search, never browse
- Folders have high unread counts

**Solution**:
This is fine! You're a search-first person.

1. Simplify to minimal structure:
   ```
   Inbox
   └── Archive
   ```

2. Rely on search:
   ```
   search_emails(mailbox="All", subject_keyword="...")
   search_emails(mailbox="All", sender="...")
   search_emails(mailbox="All", date_from="...")
   ```

3. Use flags instead of folders:
   ```
   update_email_status(action="flag", ...)  # For action items
   ```

### "Folders become dumping grounds"

**Symptoms**:
- Folders with 500+ emails
- Haven't looked at folder in months
- "Archive" has 10,000+ emails

**Solution**:
1. **Accept it**: Archive folders are meant to be large
2. **Export if needed**: `export_emails()` for backup
3. **Delete old**: Emails >2 years old probably not needed
4. **Use subfolders by year** for Archive:
   ```
   Archive/
   ├── 2025
   ├── 2024
   └── 2023
   ```

### "Can't decide where to file emails"

**Symptoms**:
- Spending >30 seconds deciding per email
- Emails that fit multiple categories
- Creating new folders often

**Solution**:
1. **Default to Archive**: When in doubt, archive it
2. **Use search tags in subject**: Add [ProjectName] to subjects
3. **Rely on search**: File is for convenience, not requirement
4. **Time-box filing**: Max 10 seconds per email, else archive

## Advanced Organization Techniques

### Nested Folders for Nested Projects

```
Projects/
├── ClientA/
│   ├── Project Alpha
│   ├── Project Beta
│   └── Maintenance
├── ClientB/
│   └── Project Gamma
└── Internal/
    ├── Team Building
    └── Process Improvement
```

**Moving to nested folders**:
```
# Note the "/" separator for nested paths
move_email(
    to_mailbox="Projects/ClientA/Project Alpha",
    subject_keyword="Alpha",
    max_moves=10
)
```

### Smart Search Patterns Instead of Folders

**Replace this folder structure**:
```
Urgent/
High Priority/
Medium Priority/
Low Priority/
```

**With saved search patterns**:
```
# Urgent
search_emails(subject_keyword="urgent", read_status="unread")

# From boss (high priority)
search_emails(sender="boss@company.com", read_status="unread")

# Flagged (action items)
search_emails(mailbox="All")  # View flags in results

# Old (low priority)
search_emails(date_to="2025-01-01")
```

**Benefit**: No manual filing needed; dynamic lists

### Temporary Project Folders

For short-term projects (2-4 weeks):

```
# Create temporary folder in Mail app
# Use during project
move_email(to_mailbox="Temp/ProjectName", ...)

# When project completes, bulk archive
search_emails(mailbox="Temp/ProjectName", max_results=100)
move_email(to_mailbox="Archive/2025/ProjectName", ...)

# Delete empty temp folder in Mail app
```

### Folder Naming Conventions

**Use prefixes for ordering**:
```
01_Action Required
02_Waiting For
03_Projects
04_Reference
05_Archive
```

**Use brackets for metadata**:
```
[ACTIVE] Project Alpha
[DONE] Project Beta
[HOLD] Project Gamma
```

**Use dates for time-based folders**:
```
Archive/
├── 2025-Q1
├── 2025-Q2
└── 2024
```

## Migration Strategies

### From Complex to Simple

**Current**: 50 folders, 4 levels deep
**Goal**: <10 folders, 2 levels

**Strategy**:
1. **Create new simple structure** in Mail app
2. **Don't migrate immediately**
3. **Use new structure for new emails** only
4. **Search old structure** when needed
5. **After 3 months**, bulk archive old folders
   ```
   # Move entire old structure to Archive
   # Do this manually in Mail app
   ```

### From Simple to Organized

**Current**: Just Inbox and Archive
**Goal**: Project-based structure

**Strategy**:
1. **Analyze patterns**:
   ```
   get_statistics(scope="account_overview", days_back=90)
   ```
2. **Create top 5 project folders** only
3. **File new emails** going forward
4. **Backfill key projects** only:
   ```
   search_emails(subject_keyword="ProjectName", mailbox="All", max_results=50)
   move_email(to_mailbox="Projects/ProjectName", ...)
   ```
5. **Leave Archive alone** - search when needed

## Tools Reference

| Task | Tool | Example |
|------|------|---------|
| View structure | `list_mailboxes()` | include_counts=True |
| Move emails | `move_email()` | to_mailbox="path/to/folder" |
| Batch move | `move_email()` | max_moves=20 |
| Find emails | `search_emails()` | mailbox="All" |
| Check patterns | `get_statistics()` | scope="account_overview" |
| Mailbox stats | `get_statistics()` | scope="mailbox_breakdown" |
| Export folder | `export_emails()` | scope="entire_mailbox" |

## Decision Framework

**Should I create a folder?**

Answer these questions:

1. **Do I receive 5+ emails per week in this category?**
   - No → Use search, don't create folder
   - Yes → Continue to Q2

2. **Will I actively file emails here?**
   - No → Use search, don't create folder
   - Yes → Continue to Q3

3. **Is this category long-term (3+ months)?**
   - No → Use temporary folder or search
   - Yes → Create the folder

4. **Can I describe clear filing rules?**
   - No → Use search
   - Yes → Create the folder

**If all answers are "Yes"**, create the folder. Otherwise, use search.

## Remember

- **Folders are tools, not goals**: Organize to enable work, not for organization's sake
- **Search is powerful**: Trust your search tools; don't over-organize
- **Simple is sustainable**: Complex structures collapse; simple structures last
- **Adapt over time**: Your needs change; your structure should too
- **When in doubt, archive**: Better to search later than waste time filing now

---

**Action Item**: Review your current folder structure with `list_mailboxes()` right now. Delete or archive any folder you haven't used in 30 days.
