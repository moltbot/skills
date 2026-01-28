#!/usr/bin/env node

import { OpenAIClient } from 'openai-fetch';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SESSIONS_DIR = join(homedir(), '.cache', 'relay-to-agent', 'sessions');
const CONFIG_PATH = process.env.RELAY_CONFIG || join(__dirname, '..', 'agents.json');

// --- Load config ---
function loadConfig() {
  if (!existsSync(CONFIG_PATH)) {
    console.error(`Error: Config file not found at ${CONFIG_PATH}`);
    console.error('Create agents.json or set RELAY_CONFIG env var.');
    console.error(`\nExample agents.json:\n${JSON.stringify({
      baseUrl: "https://api.example.com/v1",
      agents: [
        { id: "my-agent", name: "My Agent", description: "Description", model: "model-id" }
      ]
    }, null, 2)}`);
    process.exit(1);
  }
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
  } catch (e) {
    console.error(`Error parsing config: ${e.message}`);
    process.exit(1);
  }
}

// --- Args ---
const args = process.argv.slice(2);
let agentId = null;
let message = null;
let resetSession = false;
let listAgents = false;
let sessionId = 'default';
let jsonOutput = false;

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--agent':
      agentId = args[++i];
      break;
    case '--reset':
      resetSession = true;
      break;
    case '--list':
      listAgents = true;
      break;
    case '--session':
      sessionId = args[++i];
      break;
    case '--json':
      jsonOutput = true;
      break;
    case '--help':
    case '-h':
      usage();
      break;
    default:
      if (!args[i].startsWith('-')) {
        message = args[i];
      }
  }
}

function usage() {
  console.log(`Usage: relay.mjs [options] "message"

Options:
  --agent ID      Target agent (required for sending)
  --reset         Reset session before sending
  --list          List available agents
  --session ID    Custom session ID (default: "default")
  --json          Raw JSON output
  --help          Show this help

Environment:
  RELAY_API_KEY   API key for the endpoint (required)
  RELAY_BASE_URL  Override base URL from config
  RELAY_CONFIG    Path to agents.json config file`);
  process.exit(0);
}

// --- List agents ---
if (listAgents) {
  const config = loadConfig();
  const agents = config.agents || [];

  if (jsonOutput) {
    console.log(JSON.stringify(agents, null, 2));
  } else {
    console.log(`Endpoint: ${config.baseUrl || '(not set)'}\n`);
    console.log('Available agents:\n');
    for (const agent of agents) {
      console.log(`  ${agent.id}`);
      console.log(`    ${agent.name} — ${agent.description}`);
      if (agent.model && agent.model !== agent.id) {
        console.log(`    Model: ${agent.model}`);
      }
      console.log('');
    }
  }
  process.exit(0);
}

// --- Validate ---
if (!agentId || !message) {
  console.error('Error: --agent and a message are required');
  console.error('Usage: relay.mjs --agent <id> "message"');
  console.error('Run with --list to see available agents');
  process.exit(1);
}

const apiKey = process.env.RELAY_API_KEY;
if (!apiKey) {
  console.error('Error: RELAY_API_KEY environment variable not set');
  process.exit(1);
}

const config = loadConfig();
const agents = config.agents || [];
const agent = agents.find(a => a.id === agentId);

if (!agent) {
  console.error(`Error: Agent "${agentId}" not found`);
  console.error('Available: ' + agents.map(a => a.id).join(', '));
  process.exit(1);
}

const baseURL = process.env.RELAY_BASE_URL || config.baseUrl;
if (!baseURL) {
  console.error('Error: No base URL configured. Set baseUrl in agents.json or RELAY_BASE_URL env var.');
  process.exit(1);
}

// --- Session management ---
function getSessionPath(agentId, sessionId) {
  return join(SESSIONS_DIR, `${agentId}_${sessionId}.json`);
}

function loadSession(agentId, sessionId) {
  const path = getSessionPath(agentId, sessionId);
  if (!existsSync(path)) return [];
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return [];
  }
}

function saveSession(agentId, sessionId, messages) {
  mkdirSync(SESSIONS_DIR, { recursive: true });
  const path = getSessionPath(agentId, sessionId);
  const trimmed = messages.slice(-50);
  writeFileSync(path, JSON.stringify(trimmed, null, 2));
}

function clearSession(agentId, sessionId) {
  const path = getSessionPath(agentId, sessionId);
  if (existsSync(path)) {
    writeFileSync(path, '[]');
  }
}

// --- Main ---
async function main() {
  const client = new OpenAIClient({
    apiKey,
    baseUrl: baseURL
  });

  let messages = resetSession ? [] : loadSession(agentId, sessionId);

  if (resetSession) {
    clearSession(agentId, sessionId);
  }

  messages.push({ role: 'user', content: message });

  try {
    const model = agent.model || agent.externalId || agent.id;

    const response = await client.createChatCompletion({
      model,
      messages
    });

    const reply = response.choices?.[0]?.message;

    if (!reply) {
      console.error('Error: No reply from agent');
      if (jsonOutput) console.log(JSON.stringify(response, null, 2));
      process.exit(1);
    }

    messages.push({ role: 'assistant', content: reply.content });
    saveSession(agentId, sessionId, messages);

    if (jsonOutput) {
      console.log(JSON.stringify({
        agent: agent.id,
        model: model,
        session: sessionId,
        reply: reply.content,
        messages_count: messages.length
      }, null, 2));
    } else {
      console.log(reply.content);
    }
  } catch (error) {
    const errMsg = error?.message || JSON.stringify(error);
    console.error(`Error: ${errMsg}`);
    if (error?.response) {
      try {
        const body = await error.response.text();
        console.error(`Response: ${body}`);
      } catch {}
    }
    process.exit(1);
  }
}

main();
