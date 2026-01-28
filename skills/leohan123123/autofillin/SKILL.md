---
name: autofillin
description: Automated web form filling and file uploading skill with Playwright browser automation. Handles login persistence, form detection, file uploads, and waits for manual confirmation before submission.
version: 1.2.0
trigger: autofillin
author: leohan123123
tags: automation, form, upload, browser, playwright, mcp
---

# AutoFillIn - Browser Form Automation Skill

**Trigger Command**: `autofillin`

An intelligent automation skill that fills web forms, uploads files/folders to correct positions, and handles complex multi-field submissions with persistent login support.

## What's New in v1.2.0

- Enhanced Error Handling: Graceful error recovery with detailed messages
- Consolidated Configuration: Merged mcp-config into SKILL.md
- Improved Robustness: Better port conflict handling and process management
- Cross-platform Fixes: Improved Windows/Linux compatibility

## Changelog

| Version | Changes |
|---------|---------|
| v1.2.0 | Enhanced error handling, consolidated config, improved robustness |
| v1.1.0 | Added Playwright support, session persistence, folder upload |
| v1.0.0 | Initial release with Chrome debug mode |

## Features

- Navigate to any web form URL
- Auto-fill text fields, textareas, dropdowns
- Upload files/folders to correct form positions
- Persistent login via saved browser storage
- Wait for manual confirmation before submission
- Support for multi-file uploads with position mapping
- Graceful error recovery

## Quick Setup

```bash
# 1. Install Playwright browsers
npx playwright install chromium

# 2. First-time login (saves session for reuse)
npx playwright open --save-storage=~/.playwright-auth.json "https://your-target-site.com"
# Login manually in the browser that opens, then close it

# 3. Future runs will auto-login using saved session
npx playwright open --load-storage=~/.playwright-auth.json "https://your-target-site.com"
```

## MCP Configuration

Add to your MCP settings (Claude Code, OpenCode, etc.):

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-playwright"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/"]
    }
  }
}
```

Environment variables for shell integration:
```bash
export CHROME_DEBUG_PORT=9222
export CHROME_USER_DATA_DIR="$HOME/.chrome-autofillin"
```

## Browser Automation Options

### Option 1: Playwright CLI (Recommended for OAuth sites)

```bash
# First login - saves session
npx playwright open --save-storage=~/.playwright-auth.json "https://molthub.com/upload"

# Subsequent uses - loads saved session
npx playwright open --load-storage=~/.playwright-auth.json "https://molthub.com/upload"
```

Advantages:
- No "unsafe browser" blocks from Google/GitHub OAuth
- Session persistence across runs
- Works with MCP browser tools

### Option 2: Chrome Debug Mode (For non-OAuth sites)

```bash
# Start Chrome with debug port
./scripts/start-chrome.sh "https://example.com/form"

# With your default Chrome profile (keeps existing logins)
./scripts/start-chrome.sh --use-default-profile "https://example.com/form"
```

Note: Chrome debug mode with custom `--user-data-dir` is blocked by Google OAuth. Use Playwright for sites requiring Google/GitHub login.

## Usage Examples

### Basic Form Filling

```
autofillin https://example.com/form
- Fill "Name" field with "John Doe"
- Fill "Email" field with "john@example.com"
- Upload resume.pdf to file input
```

### MoltHub Skill Upload

```
autofillin https://molthub.com/upload

Form Data:
- Slug: autofillin
- Display name: AutoFillIn - Browser Form Automation Skill
- Version: 1.2.0
- Tags: automation, browser, form, playwright, mcp
- Changelog: v1.2.0 - Enhanced error handling, consolidated config

Upload:
- Folder: ~/clawd/skills/autofillin/

[WAIT FOR MANUAL CONFIRMATION TO PUBLISH]
```

### Multi-file Upload with Position Mapping

```
autofillin https://example.com/document-upload

Files to upload:
- Position 1 (ID Document): ~/documents/id_card.pdf
- Position 2 (Proof of Address): ~/documents/utility_bill.pdf
- Position 3 (Photo): ~/photos/headshot.jpg

[WAIT FOR MANUAL CONFIRMATION]
```

## Workflow

```
1. BROWSER SETUP
   - Check for saved session (~/.playwright-auth.json)
   - Launch Playwright Chromium with session
   - Or prompt for one-time login if no session exists

2. NAVIGATION & LOGIN
   - Navigate to target URL
   - Detect if login is required
   - If login needed: Fill username, prompt for password, save session

3. PAGE ANALYSIS
   - Take accessibility snapshot
   - Identify all form fields
   - Map field labels to input elements

4. AUTO-FILL PHASE
   - Fill text fields using fill() or fill_form()
   - Select dropdown options
   - Upload files/folders via upload_file()

5. CONFIRMATION PHASE
   - Display summary of filled data
   - WAIT FOR MANUAL CONFIRMATION
   - User reviews and clicks Submit/Publish
```

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| take_snapshot | Get page accessibility tree |
| fill | Fill single form field |
| fill_form | Fill multiple fields at once |
| upload_file | Upload file or folder |
| browser_click | Click buttons |
| evaluate_script | Run JavaScript |
| navigate_page | Navigate to URLs |

## Credential Management

### Safe Storage (Recommended)

```bash
# Use macOS Keychain
security add-generic-password -a "github" -s "autofillin" -w "your-password"
security find-generic-password -a "github" -s "autofillin" -w

# Use Linux secret-tool
secret-tool store --label="autofillin-github" service autofillin username github

# Use Windows Credential Manager
cmdkey /add:autofillin-github /user:github /pass:your-password
```

### Session Persistence

Sessions saved to `~/.playwright-auth.json` include cookies, localStorage, and sessionStorage.

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| Unsafe browser | Google OAuth blocked | Use Playwright instead of Chrome debug |
| Login required | Session expired | Run with --save-storage |
| Element not found | Page changed | Take new snapshot |
| Upload failed | Wrong file type | Check webkitdirectory |
| Port in use | Another Chrome instance | Script auto-kills conflicting process |
| Chrome not found | Not installed | Run setup-env.sh |

## Troubleshooting

### Chrome won't start with debug mode
```bash
# Check if port is in use
lsof -i:9222

# Kill existing processes
pkill -f "remote-debugging-port=9222"

# Retry
./scripts/start-chrome.sh "https://example.com"
```

### Session not persisting
```bash
# Verify auth file exists
ls -la ~/.playwright-auth.json

# Re-authenticate
npx playwright open --save-storage=~/.playwright-auth.json "https://target-site.com"
```

### File upload not working
- Ensure file path is absolute
- Check file permissions: `ls -la /path/to/file`
- For folder uploads, verify the input has `webkitdirectory` attribute

## Files in This Skill

```
autofillin/
├── SKILL.md              # This documentation (includes MCP config)
└── scripts/
    ├── setup-env.sh      # Environment setup (cross-platform)
    ├── start-chrome.sh   # Chrome debug launcher
    └── autofillin.sh     # Main orchestrator with error handling
```

## Author

- GitHub: [@leohan123123](https://github.com/leohan123123)

## License

MIT
