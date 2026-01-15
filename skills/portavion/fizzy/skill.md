---
name: fizzy
description: Manages Fizzy boards, cards, steps, comments, and reactions. Use when user asks about boards, cards, tasks, backlog or anything Fizzy.
version: 1.0.0
---

# Fizzy CLI Skill

## Requirements (Install & Auth)

### Install via Homebrew (macOS)

```bash
brew install robzolkos/fizzy-cli/fizzy-cli
```

### Configure Credentials

The CLI needs your API token and account. You can set these via environment variables or config files.

**Environment variables (recommended for Clawdbot):**

```bash
# Set these before running fizzy commands
export FIZZY_TOKEN="your_token_here"
export FIZZY_ACCOUNT="your_account_slug"  # e.g., "0000001"
export FIZZY_API_URL="https://fizzy.domain.net/"  # self-hosted
export FIZZY_BOARD="your_default_board_id"  # optional
```

**Or use a config file** (`~/.config/fizzy/config.yaml`):

```yaml
token: your_token_here
account: your_account_slug
api_url: https://fizzy.domain.net/
board: your_default_board_id
```

### Get Your Token

1. Go to your Fizzy profile → Personal Access Tokens
2. Generate a new token with Read + Write permissions

## ID Formats

**IMPORTANT:** Cards use TWO identifiers:

| Field    | Format                      | Use For                                         |
| -------- | --------------------------- | ----------------------------------------------- |
| `id`     | `03fe4rug9kt1mpgyy51lq8i5i` | Internal ID (in JSON responses)                 |
| `number` | `579`                       | CLI commands (`card show`, `card update`, etc.) |

**All card CLI commands use the card NUMBER, not the ID.**

Other resources (boards, columns, comments, steps, reactions, users) use their `id` field.

---

## Response Structure

All responses follow this structure:

```json
{
  "success": true,
  "data": { ... },           // Single object or array
  "meta": {
    "timestamp": "2026-01-12T21:21:48Z"
  }
}
```

**List responses with pagination:**

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "has_next": true,
    "next_url": "https://..."
  },
  "meta": { ... }
}
```

**Error responses:**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Not Found",
    "status": 404
  },
  "meta": { ... }
}
```

**Create/update responses include location:**

```json
{
  "success": true,
  "data": { ... },
  "location": "/6102600/cards/579.json",
  "meta": { ... }
}
```

---

## Resource Schemas

Complete field reference for all resources. Use these exact field paths in jq queries.

### Card Schema

**IMPORTANT:** `card list` and `card show` return different fields. `steps` only in `card show`.

| Field                | Type        | Description                            |
| -------------------- | ----------- | -------------------------------------- |
| `number`             | integer     | **Use this for CLI commands**          |
| `id`                 | string      | Internal ID (in responses only)        |
| `title`              | string      | Card title                             |
| `description`        | string      | Plain text content (**NOT an object**) |
| `description_html`   | string      | HTML version with attachments          |
| `status`             | string      | Usually "published" for active cards   |
| `closed`             | boolean     | true = card is closed                  |
| `golden`             | boolean     | true = starred/important               |
| `image_url`          | string/null | Header/background image URL            |
| `has_more_assignees` | boolean     | More assignees than shown              |
| `created_at`         | timestamp   | ISO 8601                               |
| `last_active_at`     | timestamp   | ISO 8601                               |
| `url`                | string      | Web URL                                |
| `comments_url`       | string      | Comments endpoint URL                  |
| `board`              | object      | Nested Board (see below)               |
| `creator`            | object      | Nested User (see below)                |
| `assignees`          | array       | Array of User objects                  |
| `tags`               | array       | Array of Tag objects                   |
| `steps`              | array       | **Only in `card show`**, not in list   |

### Board Schema

| Field        | Type      | Description                     |
| ------------ | --------- | ------------------------------- |
| `id`         | string    | Board ID (use for CLI commands) |
| `name`       | string    | Board name                      |
| `all_access` | boolean   | All users have access           |
| `created_at` | timestamp | ISO 8601                        |
| `url`        | string    | Web URL                         |
| `creator`    | object    | Nested User                     |

### User Schema

| Field           | Type      | Description                    |
| --------------- | --------- | ------------------------------ |
| `id`            | string    | User ID (use for CLI commands) |
| `name`          | string    | Display name                   |
| `email_address` | string    | Email                          |
| `role`          | string    | "owner", "admin", or "member"  |
| `active`        | boolean   | Account is active              |
| `created_at`    | timestamp | ISO 8601                       |
| `url`           | string    | Web URL                        |

### Comment Schema

| Field             | Type      | Description                                |
| ----------------- | --------- | ------------------------------------------ |
| `id`              | string    | Comment ID (use for CLI commands)          |
| `body`            | object    | **Nested object with html and plain_text** |
| `body.html`       | string    | HTML content                               |
| `body.plain_text` | string    | Plain text content                         |
| `created_at`      | timestamp | ISO 8601                                   |
| `updated_at`      | timestamp | ISO 8601                                   |
| `url`             | string    | Web URL                                    |
| `reactions_url`   | string    | Reactions endpoint URL                     |
| `creator`         | object    | Nested User                                |
| `card`            | object    | Nested {id, url}                           |

### Step Schema

| Field       | Type    | Description                    |
| ----------- | ------- | ------------------------------ |
| `id`        | string  | Step ID (use for CLI commands) |
| `content`   | string  | Step text                      |
| `completed` | boolean | Completion status              |

### Column Schema

| Field    | Type    | Description                                         |
| -------- | ------- | --------------------------------------------------- |
| `id`     | string  | Column ID or pseudo ID ("not-now", "maybe", "done") |
| `name`   | string  | Display name                                        |
| `kind`   | string  | "not_now", "triage", "closed", or custom            |
| `pseudo` | boolean | true = built-in column                              |

### Tag Schema

| Field        | Type      | Description |
| ------------ | --------- | ----------- |
| `id`         | string    | Tag ID      |
| `title`      | string    | Tag name    |
| `created_at` | timestamp | ISO 8601    |
| `url`        | string    | Web URL     |

### Reaction Schema

| Field     | Type   | Description                        |
| --------- | ------ | ---------------------------------- |
| `id`      | string | Reaction ID (use for CLI commands) |
| `content` | string | Emoji                              |
| `url`     | string | Web URL                            |
| `reacter` | object | Nested User                        |

### Identity Schema (from `identity show`)

| Field             | Type   | Description                       |
| ----------------- | ------ | --------------------------------- |
| `accounts`        | array  | Array of Account objects          |
| `accounts[].id`   | string | Account ID                        |
| `accounts[].name` | string | Account name                      |
| `accounts[].slug` | string | Account slug (use with --account) |
| `accounts[].user` | object | Your User in this account         |

### Key Schema Differences

| Resource | Text Field                  | HTML Field                   |
| -------- | --------------------------- | ---------------------------- |
| Card     | `.description` (string)     | `.description_html` (string) |
| Comment  | `.body.plain_text` (nested) | `.body.html` (nested)        |

---

## Global Flags

All commands support:

| Flag             | Description                            |
| ---------------- | -------------------------------------- |
| `--account SLUG` | Account slug (for multi-account users) |
| `--pretty`       | Pretty-print JSON output               |
| `--verbose`      | Show request/response details          |

---

## Pagination

List commands use `--page` for pagination. There is NO `--limit` flag.

```bash
# Get first page (default)
fizzy card list --page 1

# Get specific number of results using jq
fizzy card list --page 1 | jq '.data[:5]'

# Fetch ALL pages at once
fizzy card list --all
```

Commands supporting `--all` and `--page`:

- `board list`
- `card list`
- `comment list`
- `tag list`
- `user list`
- `notification list`

---

## Common jq Patterns

### Reducing Output

```bash
# Card summary (most useful)
fizzy card list | jq '[.data[] | {number, title, status, board: .board.name}]'

# First N items
fizzy card list | jq '.data[:5]'

# Just IDs
fizzy board list | jq '[.data[].id]'

# Specific fields from single item
fizzy card show 579 | jq '.data | {number, title, status, golden}'

# Card with description length (description is a string, not object)
fizzy card show 579 | jq '.data | {number, title, desc_length: (.description | length)}'
```

### Filtering

```bash
# Cards with a specific status
fizzy card list --all | jq '[.data[] | select(.status == "published")]'

# Golden cards only
fizzy card list --indexed-by golden | jq '[.data[] | {number, title}]'

# Cards with non-empty descriptions
fizzy card list | jq '[.data[] | select(.description | length > 0) | {number, title}]'

# Cards with steps (must use card show, steps not in list)
fizzy card show 579 | jq '.data.steps'
```

### Extracting Nested Data

```bash
# Comment text only (body.plain_text for comments)
fizzy comment list --card 579 | jq '[.data[].body.plain_text]'

# Card description (just .description for cards - it's a string)
fizzy card show 579 | jq '.data.description'

# Step completion status
fizzy card show 579 | jq '[.data.steps[] | {content, completed}]'
```

### Activity Analysis

```bash
# Cards with steps count (requires card show for each)
fizzy card show 579 | jq '.data | {number, title, steps_count: (.steps | length)}'

# Comments count for a card
fizzy comment list --card 579 | jq '.data | length'
```

---

## Command Reference

### Identity

```bash
fizzy identity show                    # Show your identity and accessible accounts
```

### Boards

```bash
fizzy board list [--page N] [--all]
fizzy board show BOARD_ID
fizzy board create --name "Name" [--all_access true/false] [--auto_postpone_period N]
fizzy board update BOARD_ID [--name "Name"] [--all_access true/false] [--auto_postpone_period N]
fizzy board delete BOARD_ID
```

### Cards

#### Listing & Viewing

```bash
fizzy card list [flags]
  --board ID                           # Filter by board
  --column ID                          # Filter by column ID or pseudo: not-yet, maybe, done
  --assignee ID                        # Filter by assignee user ID
  --tag ID                             # Filter by tag ID
  --indexed-by LANE                    # Filter: all, closed, not_now, stalled, postponing_soon, golden
  --page N                             # Page number
  --all                                # Fetch all pages

fizzy card show CARD_NUMBER            # Show card details (includes steps)
```

#### Creating & Updating

```bash
fizzy card create --board ID --title "Title" [flags]
  --description "HTML"                 # Card description (HTML)
  --description_file PATH              # Read description from file
  --image SIGNED_ID                    # Header image (use signed_id from upload)
  --tag-ids "id1,id2"                  # Comma-separated tag IDs
  --created-at TIMESTAMP               # Custom created_at

fizzy card update CARD_NUMBER [flags]
  --title "Title"
  --description "HTML"
  --description_file PATH
  --image SIGNED_ID
  --created-at TIMESTAMP

fizzy card delete CARD_NUMBER
```

#### Status Changes

```bash
fizzy card close CARD_NUMBER           # Close card (sets closed: true)
fizzy card reopen CARD_NUMBER          # Reopen closed card
fizzy card postpone CARD_NUMBER        # Move to Not Now lane
fizzy card untriage CARD_NUMBER        # Remove from column, back to triage
```

**Note:** Card `status` field stays "published" for active cards. Use:

- `closed: true/false` to check if closed
- `--indexed-by not_now` to find postponed cards
- `--indexed-by closed` to find closed cards

#### Actions

```bash
fizzy card column CARD_NUMBER --column ID     # Move to column (use column ID or: maybe, not-yet, done)
fizzy card assign CARD_NUMBER --user ID       # Toggle user assignment
fizzy card tag CARD_NUMBER --tag "name"       # Toggle tag (creates tag if needed)
fizzy card watch CARD_NUMBER                  # Subscribe to notifications
fizzy card unwatch CARD_NUMBER                # Unsubscribe
fizzy card golden CARD_NUMBER                 # Mark as golden/starred
fizzy card ungolden CARD_NUMBER               # Remove golden status
fizzy card image-remove CARD_NUMBER           # Remove header image
```

#### Attachments

```bash
fizzy card attachments show CARD_NUMBER                    # List attachments
fizzy card attachments download CARD_NUMBER [INDEX]        # Download (1-based index)
  -o, --output FILENAME                                    # Output filename (single file)
```

### Columns

Boards have pseudo columns by default: `not-yet`, `maybe`, `done`

```bash
fizzy column list --board ID
fizzy column show COLUMN_ID --board ID
fizzy column create --board ID --name "Name" [--color HEX]
fizzy column update COLUMN_ID --board ID [--name "Name"] [--color HEX]
fizzy column delete COLUMN_ID --board ID
```

### Comments

```bash
fizzy comment list --card NUMBER [--page N] [--all]
fizzy comment show COMMENT_ID --card NUMBER
fizzy comment create --card NUMBER --body "HTML" [--body_file PATH] [--created-at TIMESTAMP]
fizzy comment update COMMENT_ID --card NUMBER [--body "HTML"] [--body_file PATH]
fizzy comment delete COMMENT_ID --card NUMBER
```

### Steps (To-Do Items)

Steps are returned in `card show` response. No separate list command.

```bash
fizzy step show STEP_ID --card NUMBER
fizzy step create --card NUMBER --content "Text" [--completed]
fizzy step update STEP_ID --card NUMBER [--content "Text"] [--completed] [--not_completed]
fizzy step delete STEP_ID --card NUMBER
```

### Reactions

```bash
fizzy reaction list --card NUMBER --comment COMMENT_ID
fizzy reaction create --card NUMBER --comment COMMENT_ID --content "emoji"
fizzy reaction delete REACTION_ID --card NUMBER --comment COMMENT_ID
```

### Tags

Tags are created automatically when using `card tag`. List shows all existing tags.

```bash
fizzy tag list [--page N] [--all]
```

### Users

```bash
fizzy user list [--page N] [--all]
fizzy user show USER_ID
```

### Notifications

```bash
fizzy notification list [--page N] [--all]
fizzy notification read NOTIFICATION_ID
fizzy notification read-all
fizzy notification unread NOTIFICATION_ID
```

### File Uploads

```bash
fizzy upload file PATH
# Returns: { "signed_id": "...", "attachable_sgid": "..." }
```

| ID                | Use For                                             |
| ----------------- | --------------------------------------------------- |
| `signed_id`       | Card header/background images (`--image` flag)      |
| `attachable_sgid` | Inline images in rich text (descriptions, comments) |

---

## Example Workflows

### Create Card with Steps

```bash
# Create the card
CARD=$(fizzy card create --board BOARD_ID --title "New Feature" \
  --description "<p>Feature description</p>" | jq -r '.data.number')

# Add steps
fizzy step create --card $CARD --content "Design the feature"
fizzy step create --card $CARD --content "Implement backend"
fizzy step create --card $CARD --content "Write tests"
```

### Create Card with Inline Image

```bash
# Upload image
SGID=$(fizzy upload file screenshot.png | jq -r '.data.attachable_sgid')

# Create description file with embedded image
cat > desc.html << EOF
<p>See the screenshot below:</p>
<action-text-attachment sgid="$SGID"></action-text-attachment>
EOF

# Create card
fizzy card create --board BOARD_ID --title "Bug Report" --description_file desc.html
```

### Create Card with Background Image (only when explicitly requested)

```bash
# Validate file is an image
MIME=$(file --mime-type -b /path/to/image.png)
if [[ ! "$MIME" =~ ^image/ ]]; then
  echo "Error: Not a valid image (detected: $MIME)"
  exit 1
fi

# Upload and get signed_id
SIGNED_ID=$(fizzy upload file /path/to/header.png | jq -r '.data.signed_id')

# Create card with background
fizzy card create --board BOARD_ID --title "Card" --image "$SIGNED_ID"
```

### Move Card Through Workflow

```bash
# Move to a column
fizzy card column 579 --column maybe

# Assign to user
fizzy card assign 579 --user USER_ID

# Mark as golden (important)
fizzy card golden 579

# When done, close it
fizzy card close 579
```

### Add Comment with Reaction

```bash
# Add comment
COMMENT=$(fizzy comment create --card 579 --body "<p>Looks good!</p>" | jq -r '.data.id')

# Add reaction
fizzy reaction create --card 579 --comment $COMMENT --content "👍"
```

---

## Rich Text Formatting

Card descriptions and comments support HTML. For multiple paragraphs with spacing:

```html
<p>First paragraph.</p>
<p><br /></p>
<p>Second paragraph with spacing above.</p>
```

**Note:** Each `attachable_sgid` can only be used once. Upload the file again for multiple uses.

---

## Default Behaviors

- **Card images:** Use inline (via `attachable_sgid` in description) by default. Only use background/header (`signed_id` with `--image`) when user explicitly says "background" or "header".
- **Comment images:** Always inline. Comments do not support background images.

---

## Workflow Summary

1. **Determine the action** - What does the user want?
2. **Check for account context** - Use `--account=SLUG` if needed
3. **Run the fizzy command** using Bash
4. **Parse JSON output** with jq to reduce tokens
5. **Report outcome** clearly, including card numbers/entity IDs for reference
