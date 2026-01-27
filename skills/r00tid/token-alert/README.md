# 🚨 Clawdbot Token Alert Skill

**Never lose context mid-conversation!** Real-time Anthropic Claude token tracking with CLI alerts and optional dashboard.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Clawdbot](https://img.shields.io/badge/Clawdbot-Skill-blue)](https://docs.clawd.bot)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Version](https://img.shields.io/badge/version-1.2.0-orange)](https://github.com/r00tid/clawdbot-token-alert)

> 🚀 **v1.2.0** - CLI-first design + macOS Notification support + Production-ready!

## 🎯 Features

### 🎨 Dashboard & Design
- ✅ **Anthropic Claude Focus** - Optimized for Claude's 5h + Weekly limits
- ✅ **Dual Limit Tracking** - Monitor both 5-hour and weekly token budgets
- ✅ **Light/Dark Theme** - Auto-detect system theme with manual toggle
- ✅ **Real-time Updates** - 30-second refresh with Gateway integration
- ✅ **Config Management** - Persistent settings in localStorage
- ✅ **Responsive Design** - Works on desktop and mobile

### 📊 Core Features
- ✅ **6-Level Threshold System** - 25%, 50%, 75%, 90%, 95%, 100%
- ✅ **Dual Progress Bars** - 5-Hour + Weekly limits side-by-side
- ✅ **Visual On-Screen Alerts** - Fullscreen overlay notifications
- ✅ **macOS-style Sound Alerts** - Customizable volume (0-100%)
- ✅ **Browser Notifications** - Desktop alerts for critical thresholds
- ✅ **Multi-Session Tracking** - See all active chat sessions
- ✅ **Reset Detection** - Automatic 5h/weekly reset tracking
- ✅ **Color-coded Alerts** - 🟢 OK, 🟡 Low, 🟠 Medium, 🔶 High, 🔴 Critical, 🚨 Emergency
- ✅ **Time-to-Reset Display** - See exactly when limits refresh
- ✅ **Quick Actions** - New Chat, Summary, Export

## 📸 Screenshots

### Light Theme (Compact 420x680px)
![Dashboard Light Theme](assets/dashboard-v1-light.png)

### Dark Theme (Clawdbot Colors)
![Dashboard Dark Theme](assets/dashboard-v1-dark.png)

**Features shown:**
- ✅ Title: "Token Alert"
- ✅ Model: "Sonnet 4.5" (with version)
- ✅ Progress Bar: Gedämpfte Farben (#D86C50)
- ✅ Status Badge: Matching Progress Bar
- ✅ Recommendation Box: Hellgrau (#3e3e42)

## 🆕 What's New in v1.1.0

### 🎨 Custom SVG Icons
- ✅ **Professional Dashboard Icon** - Token gauge design with orange/gradient theme
- ✅ **Provider Icons** - High-quality SVG icons for:
  - 🟠 Anthropic (Claude) - Modern A-logo with brand colors
  - 🟢 OpenAI (GPT) - Professional circular design
  - 🔵 Gemini - Google's sparkle/star design
- ✅ **Scalable Graphics** - SVG format for crisp display at any size
- ✅ **No More Emojis** - Professional icons throughout the dashboard

### 🔄 Multi-Provider Support
- ✅ **Provider Tabs** - Switch between Anthropic, OpenAI, and Gemini
- ✅ **Unified Dashboard** - Same interface for all providers
- ✅ **Full Model Names** - Display complete model names:
  - "Claude Sonnet 4.5" (not just "Sonnet")
  - "GPT-4 Turbo" (not just "GPT-4")
  - "Gemini Pro 1.5" (not just "Gemini")
- ✅ **Provider-Specific Limits** - Accurate token limits per model
- ✅ **Add Provider Button** - Easy setup for new providers
- ✅ **API Integration Ready** - Backend support for:
  - OpenAI API token tracking
  - Gemini API token tracking
  - Multi-provider aggregate view

### 🏗️ Architecture Improvements
- ✅ **Modular Provider System** - Clean Python classes for each provider
- ✅ **Config Management** - Persistent settings in `~/.clawdbot/.token-alert.json`
- ✅ **API Abstraction** - Unified interface for all providers

**Asset Location:** `assets/icons/` (dashboard.svg, anthropic.svg, openai.svg, gemini.svg)

## 🆕 What's New in v2.0 (Beta)

### 📱 Progressive Web App (PWA)
- ✅ **Install as App** - Add to home screen (mobile/desktop)
- ✅ **Offline Mode** - Works without internet (cached data)
- ✅ **Service Worker** - Background sync & caching
- ✅ **Push Notifications** - Native OS notifications
- ✅ **App Shortcuts** - Quick actions from app icon

### 📊 Usage History Chart
- ✅ **24-Hour Tracking** - Visual usage trends with Chart.js
- ✅ **Multiple Timeframes** - 1h / 6h / 24h views
- ✅ **Dual Datasets** - 5h + Weekly limits on same chart
- ✅ **Theme-Aware** - Colors adapt to light/dark mode
- ✅ **Live Updates** - Auto-refresh every 30 seconds

### 🎨 Custom Theme Editor
- ✅ **Color Picker** - Customize gradient + card colors
- ✅ **Live Preview** - See changes in real-time
- ✅ **Persistent Storage** - Themes saved to localStorage
- ✅ **Smart Derivation** - Auto-calculate secondary colors
- ✅ **One-Click Reset** - Back to defaults instantly

### ⌨️ Keyboard Shortcuts
- `R` - Refresh stats
- `N` - New chat session
- `S` - Open settings
- `E` - Export memory
- `M` - Create summary
- `ESC` - Close settings
- `?` - Show keyboard help

### 🤖 Smart Automation
- ✅ **Auto-Export @ 90%** - Automatic session backup
- ✅ **Auto-Summary** - Smart summary before session end
- ✅ **ML Token Prediction** - Linear regression forecast
- ✅ **Cost Tracking** - Real-time $ cost calculation
- ✅ **Reset Detection** - Automatic limit reset tracking

### 💰 Cost Transparency
- ✅ **Claude Sonnet 4.5 Pricing** - $3/$15 per 1M tokens
- ✅ **Session Cost** - Real-time cost for current session
- ✅ **Weekly Cost** - Total weekly spending estimate
- ✅ **Cost Forecast** - Predict spending at 100%

### 🔮 ML Predictions
- ✅ **Time to 100%** - When will you hit the limit?
- ✅ **Linear Regression** - Based on last 10 data points
- ✅ **Color-Coded Urgency** - Red (<1h), Orange (<2h)
- ✅ **Stable Detection** - Shows "Stable" for flat usage

**See full implementation report:** `IMPLEMENTATION_REPORT.md`

## 📊 Example Terminal Output

```
🔶 Token Alert: Achtung!

🔶 ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱ 78.0%
156,000 / 200,000 Tokens verwendet

⚠️ Status: High Warning (Rot-Orange Zone)
💡 Verbleibend: ~44k Tokens
⏰ Geschätzte Sessions: <1 Session

🔧 Empfehlung:
   ✅ Wichtige Entscheidungen jetzt treffen
   ✅ Neue Session vorbereiten
   ✅ Token-sparend arbeiten
```

## 🚀 Quick Start

### Installation

**Via ClawdHub (Recommended):**
```bash
clawdhub install token-alert
```

**Manual Installation:**
```bash
cd ~/clawd/skills
git clone https://github.com/r00tid/clawdbot-token-alert token-alert
chmod +x token-alert/scripts/*.py
```

### Dashboard Setup

**Start Dashboard:**
```bash
cd ~/clawd/skills/token-alert/scripts
./start-dashboard.sh
```

Opens browser at `http://localhost:8765/dashboard-v3.html`

### Usage

**Interactive Dashboard:**
```bash
python3 ~/clawd/skills/token-alert/scripts/show_dashboard.py
# Opens rich UI dashboard in browser
```

**Terminal Check:**
```bash
python3 ~/clawd/skills/token-alert/scripts/check.py
# Shows formatted progress bar + status
```

**Via Grym** - Ask:
- "Show token dashboard"
- "Wie viele Tokens habe ich noch übrig?"
- "Check token status"

**Automatic Monitoring** - Add to `~/clawd/HEARTBEAT.md`:
```markdown
### Token Usage Check
- [ ] `python3 ~/clawd/skills/token-alert/scripts/check.py`
```

## 📊 Alert Thresholds

| Level | Threshold | Emoji | Color | Action |
|-------|-----------|-------|-------|--------|
| OK | 0-24% | 🟢 | Green | Continue normally |
| LOW | 25-49% | 🟡 | Yellow | Monitor usage |
| MEDIUM | 50-74% | 🟠 | Orange | Work token-efficiently |
| HIGH | 75-89% | 🔶 | Red-Orange | Prepare new session |
| CRITICAL | 90-94% | 🔴 | Red | Start new session SOON |
| EMERGENCY | 95-100% | 🚨 | Magenta | Start new session NOW! |

## 🛠️ Technical Details

### Architecture

```
skills/token-alert/
├── SKILL.md                    # Skill documentation
├── README.md                   # This file
├── LICENSE                     # MIT License
├── .clawdhub/
│   └── manifest.json           # ClawdHub metadata
├── assets/
│   ├── dashboard-78-high.png   # Screenshot (High Warning)
│   └── dashboard-96-emergency.png  # Screenshot (Emergency)
└── scripts/
    ├── check.py                # Token checker (Python 3.8+)
    ├── dashboard.html          # Rich UI dashboard
    └── show_dashboard.py       # Dashboard launcher
```

### How It Works

1. **Query Session** - Uses Clawdbot's `session_status` tool
2. **Calculate Usage** - Computes `(used / limit) * 100`
3. **Check Thresholds** - Compares against 75%, 90%, 95%
4. **Send Alert** - Outputs formatted message (Telegram-ready)

### API

```python
# scripts/check.py

def get_session_tokens() -> dict:
    """Get current session token usage"""
    return {"used": int, "limit": int, "percent": float}

def check_thresholds(percent: float) -> tuple:
    """Check if usage exceeds thresholds"""
    return ("OK"|"MEDIUM"|"HIGH"|"CRITICAL", "emoji")

def format_alert(used, limit, percent, level, emoji) -> str:
    """Format alert message for Telegram"""
    return "formatted message"
```

### Exit Codes

- `0` - OK (< 75%)
- `1` - MEDIUM (75-89%)
- `2` - HIGH (90-94%)
- `3` - CRITICAL (≥ 95%)

## 🔧 Configuration

### HEARTBEAT Integration

Add to `~/clawd/HEARTBEAT.md` for automated checks:

```markdown
## Token Monitoring (täglich)

### Morgen-Check (08:00)
- [ ] Token-Status prüfen: `python3 ~/clawd/skills/token-alert/scripts/check.py`
- **Action bei >70%:** Neue Session starten

### Mittags-Check (14:00)
- [ ] Wiederhole Token-Check

### Abend-Check (20:00)
- [ ] Final Token-Check vor Nacht
```

### Custom Thresholds

Edit `scripts/check.py` to customize thresholds:

```python
def check_thresholds(percent):
    if percent >= 95:  # Change CRITICAL threshold
        return "CRITICAL", "🔴"
    elif percent >= 90:  # Change HIGH threshold
        return "HIGH", "🟠"
    elif percent >= 75:  # Change MEDIUM threshold
        return "MEDIUM", "🟡"
    else:
        return "OK", "🟢"
```

## 📖 Use Cases

### 1. Pre-Task Check
Before starting a complex task:
```
You: "Check token status before we start"
Grym: "🟢 Token Status: 15% verbraucht (30k / 200k) - Alles gut!"
```

### 2. Mid-Session Monitor
During long conversations:
```
You: "How many tokens left?"
Grym: "🟡 Token Alert: 78% (156k / 200k) - ~44k übrig"
```

### 3. Automated Daily Check
Via HEARTBEAT every morning:
```
Grym: "☀️ Guten Morgen! Token-Check: 🟢 5% verbraucht (10k / 200k)"
```

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 🐛 Troubleshooting

### "ModuleNotFoundError"
**Problem:** Python dependencies missing  
**Solution:** Skill has no dependencies! Uses only stdlib.

### "Permission denied"
**Problem:** Script not executable  
**Solution:** `chmod +x ~/clawd/skills/token-alert/scripts/check.py`

### "No token data"
**Problem:** Clawdbot session not active  
**Solution:** Start a Clawdbot session first (`clawdbot gateway`)

## 📝 Roadmap

**v1.1.0 - Multi-Provider Support** (Planned)
- [ ] OpenAI token tracking (via API or local tracking)
- [ ] Gemini token tracking (RPM + Daily limits)
- [ ] Provider-switching tabs
- [ ] Unified alert system across providers

**v1.2.0 - Analytics** (Future)
- [ ] Historical token usage graphs
- [ ] Weekly/monthly reports
- [ ] Export usage to CSV/JSON
- [ ] Integration with `token-router` skill

> **Note:** Multi-provider support requires research on tracking OpenAI/Gemini usage efficiently. Currently focused on Anthropic Claude which has well-defined limits via Clawdbot Gateway.

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🙏 Credits

Built with ❤️ by [Grym](https://github.com/r00tid) 🥜

## 🔗 Links

- **Clawdbot Docs:** https://docs.clawd.bot
- **ClawdHub:** https://clawdhub.com
- **Issues:** https://github.com/r00tid/clawdbot-token-alert/issues
- **Discussions:** https://github.com/r00tid/clawdbot-token-alert/discussions

---

**Star ⭐ this repo if it saved your session!**
