# Changelog

All notable changes to the Token Alert Skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### In Progress
- Provider integration & testing
- Anthropic API token tracking
- OpenAI API token tracking
- Gemini API token tracking

## [0.9.0-beta] - 2026-01-26

### 🚧 Beta Release - Testing Phase

**Multi-Provider Token Tracking**
- Anthropic (Claude) provider with session_status integration
- OpenAI provider (skeleton ready for API implementation)
- Google Gemini provider (skeleton ready for API implementation)
- Provider abstraction layer for easy extension
- Interactive setup wizard (`setup_provider.py`)

**Dashboard Features**
- Light/Dark theme with auto-detection
- Manual theme toggle (persists in localStorage)
- Clawdbot Dark colors (#252526, #3e3e42)
- Compact 420x680px sizing (fits beside webchat)
- Provider tabs (Anthropic, OpenAI, Gemini)
- Material Design box-style progress bars (▰/▱)
- Smooth gradient animations

**6-Level Alert System**
- 🟢 0-24%: OK
- 🟡 25-49%: Low Warning
- 🟠 50-74%: Medium Warning
- 🔶 75-89%: High Warning
- 🔴 90-94%: Critical
- 🚨 95-100%: Emergency

**Progress Bar Colors** (Dark Mode optimized)
- Green: #4CAF50 → #66BB6A
- Yellow: #FFEB3B → #FFC107
- Orange: #D89050 → #C67C3E (gedämpft)
- Red-Orange: #D86C50 → #C65840 (gedämpft)
- Red: #D85050 → #C04040 (gedämpft)
- Magenta: #C05070 → #A84060 (gedämpft, blinkend)

**Terminal Features**
- Box-style progress bars in terminal output
- Color-coded status messages
- Session estimates (~50k avg)
- Contextual recommendations

**Configuration**
- Config file: `~/.clawdbot/token-alert.json`
- Provider-specific settings
- Theme preference (auto/light/dark)
- Notification thresholds

**Scripts**
- `check.py` - Terminal token checker
- `dashboard-v3.html` - Rich UI dashboard
- `show_dashboard.py` - Dashboard launcher
- `setup_provider.py` - Interactive provider setup
- `config.py` - Config management
- `providers/` - Provider abstraction layer

### Added
- Multi-provider architecture
- Light/Dark theme system
- Interactive setup wizard
- Config management
- Provider abstraction layer
- Compact dashboard (420x680px)
- Clawdbot Dark colors
- Gedämpfte Warning-Farben
- Session estimates
- Quick action buttons
- HEARTBEAT integration support
- ClawdHub manifest

### Technical
- Python 3.8+ required
- No external dependencies (stdlib only)
- MIT License
- GitHub: https://github.com/r00tid/clawdbot-token-alert

---

**Full Changelog**: https://github.com/r00tid/clawdbot-token-alert/commits/main
