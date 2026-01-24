---
name: chill-institute
description: Use chill.institute (web UI) to search for content and click “send to put.io” (best paired with the putio skill) — set sail, pick the best 1080p/x265 loot, and ship it.
---

# chill.institute

Use **chill.institute** via an interactive browser session to find an item and send it to put.io.

If you have both skills installed (**chill-institute** + **putio**), the workflow is much smoother: chill.institute launches the transfer, and putio verifies/monitors it from the CLI.

## Prereqs

- User must be logged in to **chill.institute** (put.io OAuth in the browser).
- The `putio` skill should be available to verify the transfer in put.io.

## End-to-end workflow

1. Open the site:
   - Start at: `https://chill.institute/sign-in`
2. If prompted, click **authenticate at put.io** and ask the USER to complete login.
3. Search for the title (include season/quality keywords if relevant).
4. Use quick filters (e.g. check **1080p**, **x265**) if available.
5. Pick the best result (prefer healthy seeders, reasonable size, and expected naming).
6. Click **send to put.io**.
7. Confirm it changed to **see in put.io**.
8. Verify on put.io:
   ```bash
   bash skills/putio/scripts/list_transfers.sh
   ```

## Browser automation notes

- Prefer `browser` tool with the isolated profile (`profile="clawd"`).
- If clicks time out, re-snapshot (`refs="aria"`) and retry on the new ref.

## Safety / policy

- Don’t ask users for their put.io password in chat.
- Don’t scrape or store cookies/session tokens in files.
- Only use this workflow for content the user has rights/permission to access.
