# Installation Guide for HabitFlow Skill

## Quick Install (TL;DR)

**Workspace installation** (recommended for single gateway):
```bash
cd <your-workspace>/skills  # e.g., ~/clawd/skills
git clone https://github.com/tralves/habit-flow-skill.git habit-flow
cd habit-flow
npm install
```

**Or shared installation** (for multiple agents):
```bash
mkdir -p ~/.clawdbot/skills
cd ~/.clawdbot/skills
git clone https://github.com/tralves/habit-flow-skill.git habit-flow
cd habit-flow
npm install
```

Then tell your agent: **"refresh skills"** or restart the gateway.

---

## Detailed Setup

### Understanding Skill Locations

Clawdbot loads skills from **three** locations with this precedence:

1. **Workspace skills**: `<workspace>/skills/` - **Highest precedence**
2. **Shared skills**: `~/.clawdbot/skills/` - Shared across all agents
3. **Bundled skills**: Shipped with clawdbot - Lowest precedence

**Where is my workspace?**
- Typically where you run your gateway from (e.g., `~/clawd/`)
- Contains your gateway configuration
- If you have `~/clawd/skills/`, that's your workspace skills directory

**When to use each:**
- **Workspace** (`~/clawd/skills/`): For a dedicated gateway, single agent (recommended)
- **Shared** (`~/.clawdbot/skills/`): Multiple agents on same machine
- **Workspace has highest priority** if skill exists in both locations

---

## Installation Options

### Option 1: Workspace Installation (Recommended)

**Best for:** Single gateway with dedicated workspace

**Install to your workspace:**
```bash
# Example: if your workspace is ~/clawd/
cd ~/clawd/skills
git clone https://github.com/tralves/habit-flow-skill.git habit-flow
cd habit-flow
npm install
```

**Benefits:**
- Highest precedence
- Keeps skills organized with your gateway
- Easy to version control with your workspace

### Option 2: Shared Installation

**Best for:** Multiple agents on same machine

**Install globally:**
```bash
mkdir -p ~/.clawdbot/skills
cd ~/.clawdbot/skills
git clone https://github.com/tralves/habit-flow-skill.git habit-flow
cd habit-flow
npm install
```

**Benefits:**
- Available to all agents
- No duplication across workspaces
- Centralized updates

### Option 3: Remote Gateway

**If your gateway is on a different machine:**

1. SSH into your gateway machine
2. Choose Option 1 or Option 2 above
3. Restart gateway or: **"refresh skills"**
4. Skill is now available to all connected nodes

---

## Verifying Installation

### Method 1: Ask Your Agent

Simply chat with your agent:
```
You: "Do you have the habit-flow skill available?"
Agent: "Yes! I have access to HabitFlow..."
```

Or trigger it directly:
```
You: "I want to start tracking meditation"
Agent: [HabitFlow skill activates]
```

### Method 2: Check Skill Directory

On the machine where you installed:
```bash
# If installed in workspace
ls -la ~/clawd/skills/habit-flow/

# Or if installed in shared directory
ls -la ~/.clawdbot/skills/habit-flow/

# Both should show:
# - SKILL.md
# - scripts/
# - src/
# - package.json
# - node_modules/ (after npm install)
```

### Method 3: Check Data Directory

After first use, verify the data directory was created:
```bash
ls -la ~/clawd/habit-flow-data/
# Should show:
# - habits.json
# - config.json
# - logs/
```

---

## Troubleshooting Installation

### Skill Not Found After Installation

**Issue:** Agent says "I don't have access to HabitFlow"

**Solutions:**
1. Verify installation location:
   ```bash
   # Check workspace installation
   ls ~/clawd/skills/habit-flow/SKILL.md

   # Or check shared installation
   ls ~/.clawdbot/skills/habit-flow/SKILL.md
   ```

2. Refresh skills:
   ```
   User: "refresh skills"
   ```

3. Restart gateway (if applicable)

4. Check that dependencies installed:
   ```bash
   # Navigate to where you installed it
   cd ~/clawd/skills/habit-flow  # or ~/.clawdbot/skills/habit-flow
   ls node_modules/
   # Should show: chrono-node, string-similarity, commander, etc.
   ```

### Node Modules Missing

**Issue:** Scripts fail with "Cannot find module"

**Solution:**
```bash
cd <your-install-location>/habit-flow  # ~/clawd/skills or ~/.clawdbot/skills
rm -rf node_modules package-lock.json
npm install
```

### Permission Issues

**Issue:** Cannot write to data directory

**Solution:**
```bash
mkdir -p ~/clawd/habit-flow-data
chmod 755 ~/clawd/habit-flow-data
```

### Wrong Machine

**Issue:** Installed on node instead of gateway

**Solution:**
1. Delete from node machine (if accidentally installed there)

2. Install on gateway machine (see Option 1 above)

---

## Updating the Skill

To update to the latest version:

```bash
# Navigate to your installation
cd ~/clawd/skills/habit-flow  # or ~/.clawdbot/skills/habit-flow

# Pull latest changes
git pull origin main

# Update dependencies
npm install

# Restart gateway or refresh skills
```

Your habit data (`~/clawd/habit-flow-data/`) will be preserved during updates.

---

## Uninstalling

### Remove the Skill

```bash
# Remove from workspace
rm -rf ~/clawd/skills/habit-flow

# Or remove from shared directory
rm -rf ~/.clawdbot/skills/habit-flow
```

### Keep or Remove Data

**Keep your habit data** (recommended if you might reinstall):
```bash
# Data stays at ~/clawd/habit-flow-data/
# You can reinstall the skill later and keep your history
```

**Remove all data** (complete removal):
```bash
rm -rf ~/clawd/habit-flow-data
```

---

## Next Steps

After installation:

1. **Read Quick Start**: `QUICKSTART.md` (5 minutes)
2. **Try First Habit**: Create and log your first habit
3. **Explore Features**: Check `SKILL.md` for full capabilities
4. **Set Up Reminders**: Configure WhatsApp notifications (optional)

---

## System Requirements

- **Node.js**: 18+ (already installed if you're running clawdbot)
- **Clawdbot**: Any recent version
- **Storage**: ~5MB for code + ~1MB per 10,000 habit logs
- **OS**: macOS, Linux, or Windows (WSL)

---

## Architecture Summary

```
┌─────────────────────────────────────┐
│   Gateway Machine                   │  ← Install HabitFlow here
│                                     │
│   Workspace: ~/clawd/skills/        │  (highest precedence)
│   OR                                │
│   Shared: ~/.clawdbot/skills/       │  (all agents)
│                                     │
│   (serves AI to all nodes)          │
└──────────┬──────────────────────────┘
           │
           ├─────────┐
           │         │
    ┌──────▼───┐ ┌──▼─────┐
    │  Node 1  │ │ Node 2 │  ← No installation needed
    │          │ │        │     (connects to gateway)
    └──────────┘ └────────┘
```

**Precedence:** workspace/skills > ~/.clawdbot/skills > bundled

---

## Getting Help

- **Quick Start**: `QUICKSTART.md`
- **Full Documentation**: `SKILL.md`
- **Issues**: https://github.com/tralves/habit-flow-skill/issues
- **Discussions**: https://github.com/tralves/habit-flow-skill/discussions

Happy habit building! 🎯
