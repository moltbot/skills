---
name: relay-to-agent
description: "Relay messages to AI agents on any OpenAI-compatible API. Supports multi-turn conversations with session management. List agents, send messages, reset sessions."
homepage: https://platform.openai.com/docs/api-reference/chat
metadata: {"clawdbot":{"emoji":"🤖","requires":{"bins":["node"]},"primaryEnv":"RELAY_API_KEY"}}
---

# Relay To Agent

Send messages to AI agents on any OpenAI-compatible endpoint. Works with Connect Chat, OpenRouter, LiteLLM, vLLM, Ollama, and any service implementing the Chat Completions API.

## List available agents

```bash
node {baseDir}/scripts/relay.mjs --list
```

## Send a message to an agent

```bash
node {baseDir}/scripts/relay.mjs --agent linkedin-alchemist "Transform this article into a LinkedIn post"
```

## Multi-turn conversation

```bash
# First message
node {baseDir}/scripts/relay.mjs --agent connect-flow-ai "Analyze our latest campaign"

# Follow-up (same session, agent remembers context)
node {baseDir}/scripts/relay.mjs --agent connect-flow-ai "Compare with last month"
```

## Reset session

```bash
node {baseDir}/scripts/relay.mjs --agent linkedin-alchemist --reset "Start fresh with this article..."
```

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `--agent ID` | Target agent identifier | (required) |
| `--reset` | Reset conversation before sending | off |
| `--list` | List available agents | — |
| `--session ID` | Custom session identifier | `default` |
| `--json` | Raw JSON output | off |

## Configuration

### agents.json

Configure agents and endpoint in `{baseDir}/agents.json`:

```json
{
  "baseUrl": "https://api.example.com/v1",
  "agents": [
    {
      "id": "my-agent",
      "name": "My Agent",
      "description": "What this agent does",
      "model": "model-id-on-the-api"
    }
  ]
}
```

### Environment variables

```bash
export RELAY_API_KEY="sk-..."          # API key (required)
export RELAY_BASE_URL="https://..."    # Override base URL from config
export RELAY_CONFIG="/path/to/agents.json"  # Custom config path
```

## Compatible Services

- **Connect Chat** — `api.connectchat.ai/api`
- **OpenRouter** — `openrouter.ai/api/v1`
- **LiteLLM** — `localhost:4000/v1`
- **vLLM** — `localhost:8000/v1`
- **Ollama** — `localhost:11434/v1`
- **Any OpenAI-compatible API**

## Session Management

Sessions are stored locally at `~/.cache/relay-to-agent/sessions/`. Each agent+session combination keeps up to 50 messages. Use `--session` for parallel conversations with the same agent.
