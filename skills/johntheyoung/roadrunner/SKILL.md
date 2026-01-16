---
name: roadrunner
description: Beeper Desktop CLI for chats, messages, search, and reminders. Prefer JSON output for automation.
homepage: https://github.com/johntheyoung/roadrunner
metadata: {"clawdbot":{"emoji":"🐦💨","requires":{"bins":["rr"]},"install":[{"id":"go","kind":"go","module":"github.com/johntheyoung/roadrunner/cmd/rr@latest","bins":["rr"],"label":"Install rr (go)"}]}}
---

# roadrunner (rr)

Use `rr` when the user wants to operate Beeper Desktop (local API). Prefer `--json` for agent use.

Setup (once)
- `rr auth set <token>`
- `rr auth status --check`
- `rr doctor`

Common commands
- List accounts: `rr accounts list --json`
- Search contacts: `rr contacts search "<account-id>" "Alice" --json`
- List chats: `rr chats list --json`
- Search chats: `rr chats search "John" --json`
- Search chats (filters): `rr chats search --inbox=primary --unread-only --json`
- Search chats (activity): `rr chats search --last-activity-after="2024-07-01T00:00:00Z" --json`
- Search by participant name: `rr chats search "Jamie" --scope=participants --json`
- Get chat: `rr chats get "!chatid:beeper.com" --json`
- Create chat (single): `rr chats create "<account-id>" --participant "<user-id>"`
- Create chat (group): `rr chats create "<account-id>" --participant "<user-a>" --participant "<user-b>" --type group --title "Project Chat" --message "Welcome!"`
- List messages: `rr messages list "!chatid:beeper.com" --json`
- Search messages: `rr messages search "dinner" --json`
- Search messages (filters): `rr messages search --sender=me --date-after="2024-07-01T00:00:00Z" --media-types=image --json`
- Send message: `rr messages send "!chatid:beeper.com" "Hello!"`
- Reply to message: `rr messages send "!chatid:beeper.com" "Thanks!" --reply-to "<message-id>"`
- Draft message (pre-fill without sending): `rr focus --chat-id="!chatid:beeper.com" --draft-text="Hello!"`
- Draft with attachment: `rr focus --chat-id="!chatid:beeper.com" --draft-attachment="/path/to/file.jpg"`
- Reminders: `rr reminders set "!chatid:beeper.com" "2h"` / `rr reminders clear "!chatid:beeper.com"`
- Archive chat: `rr chats archive "!chatid:beeper.com"` / `rr chats archive "!chatid:beeper.com" --unarchive`
- Focus app: `rr focus`
- Global search: `rr search "dinner" --json`
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
- If a DM title shows your own Matrix ID, use `--scope=participants` to find by name.
- JSON output includes `display_name` for single chats (derived from participants).
- `rr messages send` returns `pending_message_id` (temporary ID).
- Prefer `--json` (and `--no-input`) for automation.
- `BEEPER_URL` overrides API base URL; `BEEPER_TIMEOUT` sets timeout in seconds.
- JSON/Plain output goes to stdout; errors/hints go to stderr.
- Destructive commands prompt unless `--force`; `--no-input`/`BEEPER_NO_INPUT` fails without `--force`.
