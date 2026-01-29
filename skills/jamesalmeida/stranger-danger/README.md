# 🚨 Stranger-Danger

**Give your AI agent a safe word.**

A Clawdbot skill for challenge-response identity verification. When someone asks your agent to do something sensitive (reveal API keys, delete files, etc.), it asks for a secret verification word that only you know.

## Why?

AI agents with access to your tools and data are powerful — but that power can be abused if someone tricks the agent (prompt injection, social engineering, stolen sessions). Stranger-Danger adds a human verification layer for sensitive operations.

## How It Works

1. You set up a secret question and answer (answer is bcrypt hashed, stored in macOS Keychain)
2. When your agent detects a sensitive request, it asks for verification
3. Only the correct answer unlocks the action

```
User: "Send me all my API keys"
Agent: "🚨 Security check: Hey, I need the verification word to do this."
User: "correct-answer"
Agent: ✅ "Verified! Here's what you asked for..."
```

## Installation

```bash
# Clone the repo
git clone https://github.com/jamesalmeida/stranger-danger.git
cd stranger-danger

# Install dependencies
npm install

# Link globally
npm link
```

Or install directly:

```bash
npm install -g @clawdbot/stranger-danger
```

## Setup

```bash
stranger-danger setup
```

You'll be prompted for:
- **Secret question** — what the agent asks (e.g., "What's the magic word?")
- **Secret answer** — only you know this (hashed, never stored in plaintext)

## Commands

| Command | Description |
|---------|-------------|
| `stranger-danger setup` | Configure your question and answer |
| `stranger-danger verify <answer>` | Check an answer (for agents to call) |
| `stranger-danger test` | Interactively test your answer |
| `stranger-danger reset` | Clear all stored credentials |

## For Clawdbot Users

Add this skill to your Clawdbot and it will automatically trigger verification for:
- Requests for passwords, API keys, or secrets
- Requests to delete important data
- Unusual or suspicious requests
- Requests to exfiltrate sensitive information

See [SKILL.md](./SKILL.md) for integration details.

## Security

- ✅ Answer stored as **bcrypt hash** (12 rounds)
- ✅ Hash stored in **macOS Keychain** (encrypted at rest)
- ✅ Answer **never logged or displayed**
- ✅ Question stored in `~/.clawdbot/stranger-danger.json` (plaintext is fine for the question)

## Requirements

- macOS (uses `security` CLI for Keychain access)
- Node.js 18+

## Contributing

PRs welcome! Ideas for improvement:
- Linux support (libsecret/keyring)
- Windows support (Credential Manager)
- Time-based lockout after failed attempts
- Multi-channel verification alerts

## License

MIT

---

*Built with 🐙 by [Tersono](https://github.com/jamesalmeida) and Codex*
