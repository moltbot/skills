# Hammerspoon UI Automation

> Reliable macOS UI automation for Clawdbot, especially for Electron apps where cliclick fails.

## Why Hammerspoon?

**Problem:** cliclick (standard macOS CLI clicking tool) fails on:
- Electron apps (Obsidian, Slack, VS Code, Discord desktop)
- macOS system dialogs (Gatekeeper prompts, permission dialogs)
- Web-rendered UI elements

**Solution:** Hammerspoon uses `hs.eventtap` which works at a lower level and reliably clicks any UI element.

## Installation

```bash
# Install via Homebrew
brew install --cask hammerspoon

# Remove quarantine flag (avoids Gatekeeper dialog)
xattr -cr /Applications/Hammerspoon.app

# Launch
open -a Hammerspoon
```

### First-time Setup (manual steps required)
1. Click "Open" on Gatekeeper dialog if it appears
2. Grant **Accessibility** permissions when prompted
3. In Hammerspoon preferences (menu bar icon):
   - Enable "Launch at Login" (optional but recommended)

## Configuration

**Config location:** `~/.hammerspoon/init.lua`

### Current Config (HTTP API approach)

```lua
-- Hammerspoon with HTTP API for Clawdbot
hs.alert.show("🦞 Hammerspoon Loading...")

local server = hs.httpserver.new()
server:setPort(9090)

server:setCallback(function(method, path, headers, body)
    local response = ""
    local code = 200
    
    if path == "/click" and body then
        local data = hs.json.decode(body)
        if data and data.x and data.y then
            hs.eventtap.leftClick(hs.geometry.point(data.x, data.y))
            response = '{"status":"clicked","x":' .. data.x .. ',"y":' .. data.y .. '}'
        end
    elseif path == "/doubleclick" and body then
        local data = hs.json.decode(body)
        if data and data.x and data.y then
            hs.eventtap.leftClick(hs.geometry.point(data.x, data.y))
            hs.timer.usleep(50000)
            hs.eventtap.leftClick(hs.geometry.point(data.x, data.y))
            response = '{"status":"doubleclicked"}'
        end
    elseif path == "/type" and body then
        local data = hs.json.decode(body)
        if data and data.text then
            hs.eventtap.keyStrokes(data.text)
            response = '{"status":"typed"}'
        end
    elseif path == "/key" and body then
        local data = hs.json.decode(body)
        if data and data.key then
            hs.eventtap.keyStroke(data.modifiers or {}, data.key)
            response = '{"status":"pressed"}'
        end
    elseif path == "/mouse" then
        local pos = hs.mouse.absolutePosition()
        response = '{"x":' .. pos.x .. ',"y":' .. pos.y .. '}'
    elseif path == "/alert" and body then
        local data = hs.json.decode(body)
        if data and data.message then
            hs.alert.show(data.message)
            response = '{"status":"shown"}'
        end
    elseif path == "/ping" then
        response = '{"status":"pong"}'
    else
        response = '{"error":"unknown endpoint"}'
        code = 404
    end
    
    return response, code, {["Content-Type"] = "application/json"}
end)

server:start()
hs.alert.show("🦞 Hammerspoon Ready on :9090")
```

## Usage

### Helper Script

**Location:** `~/clawd/scripts/hsclick`

```bash
# Click at coordinates
~/clawd/scripts/hsclick click 500 400

# Double-click
~/clawd/scripts/hsclick double 500 400

# Type text
~/clawd/scripts/hsclick type "Hello world"

# Press a key
~/clawd/scripts/hsclick key return

# Get mouse position
~/clawd/scripts/hsclick mouse

# Show alert
~/clawd/scripts/hsclick alert "🦞 Hello!"

# Test connection
~/clawd/scripts/hsclick ping
```

### Direct HTTP API

```bash
# Click
curl -X POST localhost:9090/click -d '{"x":500,"y":400}'

# Double-click
curl -X POST localhost:9090/doubleclick -d '{"x":500,"y":400}'

# Type text
curl -X POST localhost:9090/type -d '{"text":"Hello world"}'

# Press key with modifiers
curl -X POST localhost:9090/key -d '{"key":"p","modifiers":["cmd"]}'
curl -X POST localhost:9090/key -d '{"key":"return","modifiers":[]}'

# Get mouse position
curl localhost:9090/mouse

# Show alert
curl -X POST localhost:9090/alert -d '{"message":"🦞"}'

# Health check
curl localhost:9090/ping
```

### Key Modifiers

For `/key` endpoint, valid modifiers are:
- `"cmd"` - Command (⌘)
- `"alt"` - Option (⌥)
- `"ctrl"` - Control (⌃)
- `"shift"` - Shift (⇧)

Example: Cmd+Shift+P
```bash
curl -X POST localhost:9090/key -d '{"key":"p","modifiers":["cmd","shift"]}'
```

## Why HTTP API instead of IPC?

Hammerspoon provides a CLI tool (`hs`) that uses IPC to communicate with the running Hammerspoon instance. However, on macOS Tahoe (26.x), the IPC was unreliable and would hang/timeout.

The HTTP server approach:
- Works reliably
- Easy to call from any language (curl, Python, Node, etc.)
- Can be extended with more endpoints as needed
- Survives config reloads

## Troubleshooting

### Hammerspoon not responding

```bash
# Check if running
pgrep -l Hammerspoon

# Restart
pkill Hammerspoon && open -a Hammerspoon
```

### HTTP API not responding

```bash
# Test ping
curl localhost:9090/ping

# If no response, reload config via menu bar or restart Hammerspoon
```

### Clicks not working

1. Ensure Hammerspoon has Accessibility permissions:
   - System Settings → Privacy & Security → Accessibility → Hammerspoon ✓

2. Check coordinates are correct:
   ```bash
   # Get current mouse position
   curl localhost:9090/mouse
   ```

### Config not loading

```bash
# Check for Lua syntax errors
cat ~/.hammerspoon/init.lua | lua -

# View Hammerspoon console: click menu bar icon → Console
```

## Integration with Clawdbot

When needing to click UI elements, especially in Electron apps:

1. Use `peekaboo image --mode screen` to capture screenshot
2. Identify coordinates of target element
3. Use `~/clawd/scripts/hsclick click X Y`

Example workflow:
```bash
# Capture screen
peekaboo image --mode screen --path /tmp/screen.png

# (Analyze image to find button at ~500,400)

# Click it
~/clawd/scripts/hsclick click 500 400
```

## Setup Date

- **Installed:** 2026-01-25
- **Reason:** cliclick failed on Obsidian LiveSync checkboxes
- **Solution:** HTTP API approach after IPC proved unreliable
