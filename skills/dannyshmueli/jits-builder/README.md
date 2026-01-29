# 🚀 JITS Builder - Just-In-Time Software

Build instant mini-apps from voice or text descriptions. Describe what you need, get a working tool deployed in seconds via Cloudflare tunnel.

## What is JITS?

**Just-In-Time Software** - you don't search for tools or install apps. You describe what you need and it gets built on the spot.

```
"Build me a pomodoro timer"
→ 30 seconds later: https://your-app.trycloudflare.com
```

## Features

- 🎤 **Voice or text** - Describe what you want naturally
- ⚡ **Instant deploy** - Live URL in seconds
- 🌐 **Cloudflare tunnel** - Shareable public URLs
- 📱 **Mobile-ready** - Responsive by default
- 🎨 **Beautiful** - Dark theme, polished UI

## How It Works

1. You describe the tool you need
2. Your Moltbot agent generates the code
3. Serves it locally + creates Cloudflare tunnel
4. You get a public URL instantly

## Example Apps Built

- ⏱️ Pomodoro Timer
- 💰 Tip Calculator
- 🎨 Color Palette Generator
- 📊 JSON Formatter
- 🔢 Unit Converter
- ✂️ Text Diff Tool
- 🎲 Random Decision Maker
- ⏳ Event Countdown

## Installation

### For Moltbot users:

```bash
moltbot skill install jits-builder
```

### Manual:

```bash
mkdir -p ~/.moltbot/skills/jits-builder
cd ~/.moltbot/skills/jits-builder
curl -O https://raw.githubusercontent.com/Cluka-399/jits-builder/main/SKILL.md
curl -O https://raw.githubusercontent.com/Cluka-399/jits-builder/main/jits.sh
chmod +x jits.sh
```

## Usage

Just ask your agent:

```
"Build me a timer that counts down from 5 minutes"
"I need a tool to calculate tips and split bills"
"Make a page where I can paste JSON and format it"
"Create a random color palette generator"
```

## Requirements

- Node.js
- Cloudflared (auto-downloads if missing)

## License

MIT

---

Built with 🐱🦞 by [Cluka](https://github.com/Cluka-399)
