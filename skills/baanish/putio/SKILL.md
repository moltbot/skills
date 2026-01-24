---
name: putio
description: Manage a put.io account via the kaput CLI (transfers, files, search) — hoist the mainsail, add magnets/URLs, and check transfer status; best paired with the chill-institute skill.
---

# put.io (kaput CLI)

This skill uses the unofficial **kaput** CLI to operate put.io from the command line.

If you also have the **chill-institute** skill installed, you can:
- use chill.institute to *start* a transfer (“send to put.io”), then
- use this skill to *verify and monitor* that the cargo is actually arriving.

## Install

- Requires Rust + Cargo.
- Install:
  ```bash
  cargo install kaput-cli
  ```
- Ensure `kaput` is on your PATH (typically `~/.cargo/bin`).

## Authenticate (device-code flow)

1. Run:
   ```bash
   kaput login
   ```
2. It prints a link + short code (e.g. `https://put.io/link` + `ABC123`).
3. User enters the code in the browser.
4. The CLI completes and stores a token locally.

Check auth:
```bash
bash skills/putio/scripts/check_auth.sh
```

## Common actions (scripts)

All scripts auto-locate `kaput` (supports `KAPUT_BIN=/path/to/kaput`).

- List transfers:
  ```bash
  bash skills/putio/scripts/list_transfers.sh
  ```

- Add a transfer (magnet / torrent URL / direct URL):
  ```bash
  bash skills/putio/scripts/add_transfer.sh "magnet:?xt=urn:btih:..."
  ```

- Search files:
  ```bash
  bash skills/putio/scripts/search_files.sh "query"
  ```

- Status (transfers; optionally account):
  ```bash
  bash skills/putio/scripts/status.sh
  SHOW_ACCOUNT=1 bash skills/putio/scripts/status.sh
  ```

## Raw CLI

For advanced actions:
```bash
kaput --help
kaput transfers --help
kaput files --help
```

## Security notes

- **Do not paste passwords** into chat. Use `kaput login` device-code flow.
- kaput stores credentials locally (token file). Treat it as sensitive and avoid sharing it.
- Avoid running `kaput debug` in shared logs/screenshots (may reveal local config details).
