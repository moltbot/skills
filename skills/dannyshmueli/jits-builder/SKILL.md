# JITS Builder - Just-In-Time Software 🚀

Build instant mini-apps from voice or text descriptions. Describe what you need, get a working tool deployed in seconds.

## What is JITS?

**Just-In-Time Software** - the idea that you don't need to find or install tools. You describe what you need and it gets built on the spot.

> "I need a timer that plays a sound after 25 minutes"
> "Make me a tool to split a bill between friends"  
> "Create a page where I can paste JSON and see it formatted"

## Requirements

- Cloudflared binary (auto-downloads to `/tmp/cloudflared` if missing)
- Node.js (for serving the app)

## How It Works

1. **Describe** - Voice or text, explain what you want
2. **Generate** - Agent builds a single-file HTML/JS/CSS app
3. **Deploy** - Cloudflare tunnel makes it instantly accessible
4. **Use** - Get a URL, use your tool, share it

## Usage

Just ask naturally:

```
"Build me a pomodoro timer"
"I need a quick tool to convert CSV to JSON"
"Make a tip calculator"
"Create a color palette generator"
```

The agent will:
1. Generate the HTML/JS code
2. Save to `/data/clawd/jits-apps/<name>.html`
3. Serve on a local port
4. Create Cloudflare tunnel
5. Return the public URL

## Managing JITS Apps

```bash
# List running apps
/data/clawd/skills/jits-builder/jits.sh list

# Stop an app
/data/clawd/skills/jits-builder/jits.sh stop <name>
```

## App Guidelines

When building JITS apps:

1. **Single file** - All HTML, CSS, JS in one file
2. **No dependencies** - Use vanilla JS, no external libraries
3. **Mobile-friendly** - Responsive design
4. **Dark theme** - Looks good, easy on eyes
5. **Self-contained** - No backend/API calls needed
6. **Branded** - Include "Built with JITS" badge

## Template Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🚀 JITS - [App Name]</title>
  <style>
    /* Dark theme, centered layout */
    body {
      font-family: -apple-system, sans-serif;
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    /* ... app styles ... */
  </style>
</head>
<body>
  <div class="container">
    <h1>[App Title]</h1>
    <div class="badge">Built with JITS</div>
    <!-- App content -->
  </div>
  <script>
    // App logic
  </script>
</body>
</html>
```

## Example Apps

| App | Description |
|-----|-------------|
| Pomodoro Timer | 25/5 min work/break cycles with sound |
| Tip Calculator | Split bills with custom tip % |
| JSON Formatter | Paste JSON, see it pretty-printed |
| Color Picker | Generate and copy color palettes |
| Countdown | Timer to a specific date/event |
| QR Generator | Text to QR code |
| Unit Converter | Length, weight, temperature |
| Decision Maker | Random picker for choices |

## Limitations

- **Single-page only** - No multi-page apps
- **No backend** - Client-side only, no databases
- **Temporary URLs** - Tunnels expire when stopped
- **No persistence** - Data doesn't survive refresh (use localStorage if needed)

## Directory Structure

```
/data/clawd/jits-apps/
├── pomodoro.html      # App HTML
├── pomodoro.pid       # Server process ID
├── pomodoro.port      # Port number
├── pomodoro.url       # Tunnel URL
└── pomodoro.tunnel.pid # Tunnel process ID
```

---

*"The best tool is the one you build exactly when you need it."* 🐱🦞
