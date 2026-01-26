# Clawdbot Skill: Claude Code Wingman

This directory contains the Clawdbot skill wrapper for the Claude Code Wingman.

## Installation for Clawdbot

1. **Clone the main repo** (if not already):
   ```bash
   cd ~/code
   git clone https://github.com/yossiovadia/claude-code-wingman.git
   ```

2. **Copy this skill** to your Clawdbot skills directory:
   ```bash
   cp -r ~/code/claude-code-wingman/clawdbot-skill ~/.clawdbot/skills/claude-code-wingman
   ```

   Or create a symlink:
   ```bash
   ln -s ~/code/claude-code-wingman/clawdbot-skill ~/.clawdbot/skills/claude-code-wingman
   ```

3. **Restart Clawdbot:**
   ```bash
   clawdbot gateway restart
   ```

## Usage

See `SKILL.md` for full documentation on how Clawdbot should use this skill.

## Requirements

- tmux
- Claude Code CLI (`claude`)
- Bash
- Main wingman scripts in `~/code/claude-code-wingman/`
