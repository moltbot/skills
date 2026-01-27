# SKILLS.md - Installed Skills

Skills managed via [ClawdHub](https://clawdhub.com).

## From ClawdHub

| Skill | Version | Description |
|-------|---------|-------------|
| `lastfm` | 1.0.2 | Last.fm API access — listening history, stats, discovery |
| `whatisxlistening-to` | 1.2.0 | Now-playing dashboard + CLI for Last.fm |

## Local / Unpublished

| Skill | Description |
|-------|-------------|
| `auto-updater` | Daily auto-update for Clawdbot + skills |
| `clawddocs` | Clawdbot documentation navigator |
| `clawdhub` | ClawdHub CLI skill |
| `findmy-location` | Find My location tracking via peekaboo |
| `frontend-design` | High-quality frontend generation |
| `second-brain` | Ensue-powered knowledge base |
| `self-improving-agent` | Captures learnings and corrections |
| `weather-pollen` | Weather + pollen reports |

## Commands

```bash
# List installed skills
clawdhub list

# Update all ClawdHub skills
clawdhub update --all --no-input

# Install a new skill
clawdhub install <slug>

# Publish a local skill
clawdhub publish ./skills/my-skill --slug my-skill --name "My Skill" --version 1.0.0
```

## Publishing Local Skills

To publish unpublished skills to ClawdHub:

```bash
cd ~/clawd
clawdhub publish ./skills/findmy-location --slug findmy-location --name "Find My Location" --version 1.0.0
```

Or sync all at once:

```bash
clawdhub sync
```
