---
name: youtrack
description: Interact with YouTrack project management system via REST API. Read projects and issues, create tasks, generate invoices from time tracking data, and manage knowledge base articles. Use for reading projects and work items, creating or updating issues, generating client invoices from time tracking, and working with knowledge base articles.
---

# YouTrack

YouTrack integration for project management, time tracking, and knowledge base.

## Quick Start

### Authentication

To generate a permanent token:
1. From the main navigation menu, select **Administration** > **Access Management** > **Users**
2. Find your user and click to open settings
3. Generate a new permanent API token
4. Set the token as an environment variable:

```bash
export YOUTRACK_TOKEN=your-permanent-token-here
```

**Important:** Configure your hourly rate (default $100/hour) by passing `--rate` to invoice_generator.py or updating `hourly_rate` parameter in your code.

Then use any YouTrack script:

```bash
# List all projects
python3 scripts/youtrack_api.py --url https://your-instance.youtrack.cloud --list-projects

# List issues in a project
python3 scripts/youtrack_api.py --url https://your-instance.youtrack.cloud --list-issues "project: MyProject"

# Generate invoice for a project
python3 scripts/invoice_generator.py --url https://your-instance.youtrack.cloud --project MyProject --month "January 2026" --from-date "2026-01-01"
```

## Python Scripts

### `scripts/youtrack_api.py`

Core API client for all YouTrack operations.

**In your Python code:**
```python
from youtrack_api import YouTrackAPI

api = YouTrackAPI('https://your-instance.youtrack.cloud', token='your-token')

# Projects
projects = api.get_projects()
project = api.get_project('project-id')

# Issues
issues = api.get_issues(query='project: MyProject')
issue = api.get_issue('issue-id')

# Create issue
api.create_issue('project-id', 'Summary', 'Description')

# Work items (time tracking)
work_items = api.get_work_items('issue-id')
issue_with_time = api.get_issue_with_work_items('issue-id')

# Knowledge base
articles = api.get_articles()
article = api.get_article('article-id')
api.create_article('project-id', 'Title', 'Content')
```

**CLI usage:**
```bash
python3 scripts/youtrack_api.py --url https://your-instance.youtrack.cloud \
    --token YOUR_TOKEN \
    --list-projects

python3 scripts/youtrack_api.py --url https://your-instance.youtrack.cloud \
    --get-issue ABC-123

python3 scripts/youtrack_api.py --url https://your-instance.youtrack.cloud \
    --get-articles
```

### `scripts/invoice_generator.py`

Generate client invoices from time tracking data.

**In your Python code:**
```python
from youtrack_api import YouTrackAPI
from invoice_generator import InvoiceGenerator

api = YouTrackAPI('https://your-instance.youtrack.cloud', token='your-token')
generator = InvoiceGenerator(api, hourly_rate=100.0)

# Get time data for a project
project_data = generator.get_project_time_data('project-id', from_date='2026-01-01')

# Generate invoice
invoice_text = generator.generate_invoice_text(project_data, month='January 2026')
print(invoice_text)
```

**CLI usage:**
```bash
python3 scripts/invoice_generator.py \
    --url https://your-instance.youtrack.cloud \
    --project MyProject \
    --from-date 2026-01-01 \
    --month "January 2026" \
    --rate 100 \
    --format text
```

Save the text output and print to PDF for clients.

## Common Workflows

### 1. List All Projects

```bash
python3 scripts/youtrack_api.py --url https://your-instance.youtrack.cloud --list-projects
```

### 2. Find Issues in a Project

```bash
# All issues in a project
python3 scripts/youtrack_api.py --url https://your-instance.youtrack.cloud --list-issues "project: MyProject"

# Issues updated since a date
python3 scripts/youtrack_api.py --url https://your-instance.youtrack.cloud --list-issues "project: MyProject updated >= 2026-01-01"

# Issues assigned to you
python3 scripts/youtrack_api.py --url https://your-instance.youtrack.cloud --list-issues "assignee: me"
```

### 3. Create a New Issue

```python
from youtrack_api import YouTrackAPI

api = YouTrackAPI('https://your-instance.youtrack.cloud')
api.create_issue(
    project_id='MyProject',
    summary='Task title',
    description='Task description'
)
```

### 4. Generate Monthly Invoice

```bash
# Generate invoice for January 2026
python3 scripts/invoice_generator.py \
    --url https://your-instance.youtrack.cloud \
    --project ClientProject \
    --from-date 2026-01-01 \
    --month "January 2026" \
    --rate 100 \
    --format text > invoice.txt
```

Save the text output and print to PDF for clients.

### 5. Read Knowledge Base

```python
from youtrack_api import YouTrackAPI

api = YouTrackAPI('https://your-instance.youtrack.cloud')

# All articles
articles = api.get_articles()

# Articles for specific project
articles = api.get_articles(project_id='MyProject')

# Get specific article
article = api.get_article('article-id')
```

## Billing Logic

Invoice generator uses this calculation:

1. Sum all time tracked per issue (in minutes)
2. Convert to 30-minute increments (round up)
3. Minimum charge is 30 minutes (at configured rate/2)
4. Multiply by rate (default $100/hour = $50 per half-hour)

Examples:
- 15 minutes → $50 (30 min minimum)
- 35 minutes → $100 (rounded to 60 min)
- 60 minutes → $100
- 67 minutes → $150 (rounded to 90 min)

## Environment Variables

- `YOUTRACK_TOKEN`: Your permanent API token (recommended over passing as argument)
- Set with `export YOUTRACK_TOKEN=your-token`

## API Details

See `REFERENCES.md` for:
- Complete API endpoint documentation
- Query language examples
- Field IDs and structures

## Error Handling

Scripts will raise errors for:
- Missing or invalid token
- Network issues
- API errors (404, 403, etc.)

Check stderr for error details.
