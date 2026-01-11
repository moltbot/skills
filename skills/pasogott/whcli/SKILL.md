---
name: whcli
description: Willhaben CLI for searching Austria's largest classifieds marketplace. Search listings, view details, check seller profiles.
homepage: https://github.com/pasogott/whcli
metadata: {"clawdis":{"emoji":"🏠","requires":{"bins":["whcli"]},"install":[{"id":"brew","kind":"brew","formula":"pasogott/tap/whcli","bins":["whcli"],"label":"Install whcli (Homebrew)"},{"id":"source","kind":"shell","command":"git clone https://github.com/pasogott/whcli.git && cd whcli && uv sync","label":"Install from source (uv)"}]}}
---

# whcli - Willhaben CLI 🏠

Search and browse [willhaben.at](https://willhaben.at), Austria's largest classifieds marketplace from the command line.

## Installation

### Homebrew (recommended)

```bash
brew install pasogott/tap/whcli
```

### From source (with uv)

```bash
git clone https://github.com/pasogott/whcli.git
cd whcli
uv sync
uv run whcli --help
```

## Commands

### Search

```bash
# Basic search
whcli search "iphone 15"

# With filters
whcli search "rtx 4090" --category grafikkarten --max-price 1500

# Location filter
whcli search "bicycle" -l Wien -n 20

# Only PayLivery (buyer protection)
whcli search "playstation" --paylivery

# Output as JSON for scripting
whcli search "laptop" --format json
```

**Options:**
| Option | Short | Description |
|--------|-------|-------------|
| `--category` | `-c` | Category slug (grafikkarten, smartphones, etc.) |
| `--min-price` | | Minimum price in EUR |
| `--max-price` | | Maximum price in EUR |
| `--condition` | | neu, gebraucht, defekt, neuwertig |
| `--location` | `-l` | Location/region filter |
| `--rows` | `-n` | Number of results (default: 30) |
| `--page` | `-p` | Page number |
| `--paylivery` | | Only PayLivery listings |
| `--format` | `-f` | table, json, csv |

### Show Listing Details

```bash
# View listing by ID
whcli show 1993072190

# JSON output
whcli show 1993072190 --format json
```

### Seller Profile

```bash
# View seller profile and ratings
whcli seller 29159134
```

## Examples

```bash
# Find cheap iPhones in Vienna
whcli search "iphone" -l Wien --max-price 500

# Graphics cards under €1000
whcli search "grafikkarte" --category grafikkarten --max-price 1000

# New condition only
whcli search "ps5" --condition neu

# Export search results as CSV
whcli search "furniture" -l "1220" -n 50 --format csv > results.csv
```

## Common Categories

- `grafikkarten` - Graphics cards
- `smartphones` - Phones
- `notebooks-laptops` - Laptops
- `spielkonsolen` - Gaming consoles
- `fahrraeder` - Bicycles
- `moebel` - Furniture

## Known Limitations

- ⚠️ `show` command has a bug (being fixed)
- Location filter works but may include nearby regions
- No OAuth login yet (messaging/watching not available)

## Links

- **Repository:** https://github.com/pasogott/whcli
- **Issues:** https://github.com/pasogott/whcli/issues
- **Homebrew Tap:** https://github.com/pasogott/homebrew-tap
