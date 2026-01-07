---
name: table-image
description: Generate images from tables for better readability in messaging apps like Telegram. Use when displaying tabular data.
metadata: {"clawdis":{"emoji":"📊"}}
---

# Table Image Skill

Render markdown tables as PNG images for messaging platforms that don't support markdown tables.

## Prerequisites

Install tablesnap:

```bash
go install github.com/joargp/tablesnap/cmd/tablesnap@latest
```

Or build from source:
```bash
git clone https://github.com/joargp/tablesnap.git
cd tablesnap
go build -o tablesnap ./cmd/tablesnap
```

## Usage

```bash
echo "| Header 1 | Header 2 |
|----------|----------|
| Data 1   | Data 2   |" | tablesnap -o /tmp/table.png
```

Then send with `MEDIA:/tmp/table.png`

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `-i` | stdin | Input file |
| `-o` | stdout | Output file |
| `--theme` | dark | Theme: `dark` or `light` |
| `--font-size` | 14 | Font size in pixels |
| `--padding` | 10 | Cell padding in pixels |

## Emoji Support

**Bundled** (work out of the box): ✅ ❌ 🔴 🟢 🟡 ⭕ ⚠️

**Full emoji** (one-time download):
```bash
tablesnap emojis install
```

Unsupported emoji render as □ until full set is installed.

## Example Workflow

```bash
# Create table image
echo "| Task | Status |
|------|--------|
| Build | ✅ |
| Deploy | 🚀 |" | tablesnap -o /tmp/table.png

# Send in reply
MEDIA:/tmp/table.png
```

## Notes

- Dark theme by default (matches Telegram/Discord dark mode)
- Auto-sizes to fit content
- Output ~10-20KB (messaging-friendly)
- Cross-platform (Inter font embedded)

## Links

- [tablesnap repo](https://github.com/joargp/tablesnap)
