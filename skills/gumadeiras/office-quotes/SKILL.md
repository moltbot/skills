---
name: office-quotes
description: Generate random quotes from The Office (US). Provides access to 326 offline quotes plus online mode with SVG cards, character avatars, and full episode metadata via the akashrajpurohit API. Use for fun, icebreakers, or any task requiring The Office quotes.
metadata: {"clawdbot":{"requires":{"bins":["office-quotes"]},"install":[{"id":"node","kind":"node","package":"office-quotes-cli","bins":["office-quotes"],"label":"Install office-quotes CLI (npm)"}]}}
---

# office-quotes Skill

Generate random quotes from The Office (US) TV show.

## Installation

```bash
npm install -g office-quotes-cli
```

## Usage

```bash
# Random offline quote (text only)
office-quotes

# API quote with SVG card
office-quotes --source api

# PNG output (best for Telegram)
office-quotes --source api --format png

# Light theme
office-quotes --source api --theme light
```

## Options

| Option | Description |
|--------|-------------|
| `--source <src>` | Quote source: local (default), api |
| `--format <fmt>` | Output format: svg, png, jpg, webp (default: svg) |
| `--theme <theme>` | SVG theme: dark, light (default: dark) |
| `--json` | Output as JSON |

## Quote Examples

> "Would I rather be feared or loved? Easy. Both. I want people to be afraid of how much they love me." — Michael Scott

> "Bears. Beets. Battlestar Galactica." — Jim Halpert

> "Whenever I'm about to do something, I think, 'Would an idiot do that?' And if they would, I do not do that thing." — Dwight Schrute

## Source

https://github.com/gumadeiras/office-quotes-cli
