---
name: roadrunner
description: Beeper Desktop CLI for chats, messages, search, and reminders.
homepage: https://github.com/johntheyoung/roadrunner
metadata: {"clawdbot":{"emoji":"🐦💨","requires":{"bins":["rr"]},"install":[{"id":"brew","kind":"brew","formula":"johntheyoung/tap/roadrunner","bins":["rr"],"label":"Install rr (brew)"},{"id":"go","kind":"go","module":"github.com/johntheyoung/roadrunner/cmd/rr@latest","bins":["rr"],"label":"Install rr (go)"}]}}
---

# roadrunner (rr)

Use `rr` when the user explicitly wants to operate Beeper Desktop via the local API (send, search, list chats/messages, reminders, focus).
Prefer `--json` and `--no-input` for agent use.

Safety
- Require explicit recipient (chat ID) and message text before sending.
- Confirm or ask a clarifying question if the chat ID is ambiguous.
- Use `--readonly` to block writes: `rr --readonly chats list --json`
- Use `--enable-commands` to allowlist: `rr --enable-commands=chats,messages chats list --json`
- Use `--envelope` for structured errors: `rr --json --envelope chats get "!chatid"`

Setup (once)
- `rr auth set <token>`
- `rr auth status --check`
- `rr doctor`

Common commands
- List accounts: `rr accounts list --json`
- Search contacts: `rr contacts search "<account-id>" "Alice" --json`
- Resolve contact: `rr contacts resolve "<account-id>" "Alice" --json`
- List chats: `rr chats list --json`
- Search chats: `rr chats search "John" --json`
- Search chats (filters): `rr chats search --inbox=primary --unread-only --json`
- Search chats (activity): `rr chats search --last-activity-after="2024-07-01T00:00:00Z" --json`
- Search by participant name: `rr chats search "Jamie" --scope=participants --json`
- Resolve chat: `rr chats resolve "Jamie" --json`
- Get chat: `rr chats get "!chatid:beeper.com" --json`
- Create chat (single): `rr chats create "<account-id>" --participant "<user-id>"`
- Create chat (group): `rr chats create "<account-id>" --participant "<user-a>" --participant "<user-b>" --type group --title "Project Chat" --message "Welcome!"`
- List messages: `rr messages list "!chatid:beeper.com" --json`
- List messages (download media): `rr messages list "!chatid:beeper.com" --download-media --download-dir ./media --json`
- Search messages: `rr messages search "dinner" --json`
- Search messages (filters): `rr messages search --sender=me --date-after="2024-07-01T00:00:00Z" --media-types=image --json`
- Send message: `rr messages send "!chatid:beeper.com" "Hello!"`
- Reply to message: `rr messages send "!chatid:beeper.com" "Thanks!" --reply-to "<message-id>"`
- Send message from file: `rr messages send "!chatid:beeper.com" --text-file ./message.txt`
- Send message from stdin: `cat message.txt | rr messages send "!chatid:beeper.com" --stdin`
- Tail messages (polling): `rr messages tail "!chatid:beeper.com" --interval 2s --stop-after 30s --json`
- Wait for message: `rr messages wait --chat-id="!chatid:beeper.com" --contains "deploy" --wait-timeout 2m --json`
- Message context: `rr messages context "!chatid:beeper.com" "<sortKey>" --before 5 --after 2 --json`
- Draft message (pre-fill without sending): `rr focus --chat-id="!chatid:beeper.com" --draft-text="Hello!"`
- Draft message from file: `rr focus --chat-id="!chatid:beeper.com" --draft-text-file ./draft.txt`
- Draft with attachment: `rr focus --chat-id="!chatid:beeper.com" --draft-attachment="/path/to/file.jpg"`
- Download attachment: `rr assets download "mxc://example.org/abc123" --dest "./attachment.jpg"`
- Reminders: `rr reminders set "!chatid:beeper.com" "2h"` / `rr reminders clear "!chatid:beeper.com"`
- Archive chat: `rr chats archive "!chatid:beeper.com"` / `rr chats archive "!chatid:beeper.com" --unarchive`
- Focus app: `rr focus`
- Global search: `rr search "dinner" --json`
- Status summary: `rr status --json`
- Status by account: `rr status --by-account --json`
- Unread rollup: `rr unread --json`
- Global search includes `in_groups` for participant matches.

Pagination
- Chats: `rr chats list --cursor="<oldestCursor>" --direction=before --json`
- Messages list: `rr messages list "!chatid:beeper.com" --cursor="<sortKey>" --direction=before --json`
- Messages search (max 20): `rr messages search "project" --limit=20 --json`
- Messages search page: `rr messages search "project" --cursor="<cursor>" --direction=before --json`
- Global search message paging (max 20): `rr search "dinner" --messages-limit=20 --json`
- Global search message page: `rr search "dinner" --messages-cursor="<cursor>" --messages-direction=before --json`

Notes
- Requires Beeper Desktop running; token from app settings.
- Token stored at `~/.config/beeper/config.json`. `BEEPER_TOKEN` overrides.
- Message search is literal word match (not semantic).
- `rr contacts resolve` is strict and fails on ambiguous names; resolve by ID after `contacts search` when needed.
- If a DM title shows your own Matrix ID, use `--scope=participants` to find by name.
- JSON output includes `display_name` for single chats (derived from participants).
- Message JSON includes `is_sender`, `is_unread`, `attachments`, and `reactions`.
- `downloaded_attachments` is only populated when `--download-media` is used.
- `rr messages send` returns `pending_message_id` (temporary ID).
- Prefer `--json` (and `--no-input`) for automation.
- `BEEPER_URL` overrides API base URL; `BEEPER_TIMEOUT` sets timeout in seconds.
- JSON/Plain output goes to stdout; errors/hints go to stderr.
- Destructive commands prompt unless `--force`; `--no-input`/`BEEPER_NO_INPUT` fails without `--force`.
- Use `--fail-if-empty` on list/search commands to exit with code 1 if no results.
- Use `--fields` with `--plain` to select columns (comma-separated).
- In bash/zsh, `!` triggers history expansion. Prefer single quotes, or disable history expansion (`set +H` in bash, `setopt NO_HIST_EXPAND` in zsh).
- `rr version --json` returns `features` array for capability discovery.
- Envelope error codes: `AUTH_ERROR`, `NOT_FOUND`, `VALIDATION_ERROR`, `CONNECTION_ERROR`, `INTERNAL_ERROR`.
