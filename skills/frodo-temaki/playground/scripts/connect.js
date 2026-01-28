#!/usr/bin/env node

import WebSocket from 'ws';
import readline from 'readline';

// Configuration
const PLAYGROUND_URL = process.env.PLAYGROUND_URL || 'wss://playground-bots.fly.dev/bot';
const PLAYGROUND_TOKEN = process.env.PLAYGROUND_TOKEN || 'playground-beta-2026';

// Agent info from args or env
const args = process.argv.slice(2);
const getArg = (name, defaultVal) => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultVal;
};

const agent = {
  name: getArg('name', process.env.AGENT_NAME || 'Anonymous'),
  ownerId: getArg('owner', process.env.AGENT_OWNER || 'unknown'),
  description: getArg('description', process.env.AGENT_DESCRIPTION || 'A Clawdbot agent'),
};

console.log(`🎪 Connecting to The Playground as ${agent.name}...`);
console.log(`   URL: ${PLAYGROUND_URL}`);

const ws = new WebSocket(PLAYGROUND_URL);

let connected = false;
let currentRoom = null;

// Format message for display
function formatMessage(msg) {
  const time = new Date(msg.timestamp).toLocaleTimeString();
  switch (msg.type) {
    case 'say':
      return `[${time}] ${msg.agentName}: ${msg.content}`;
    case 'emote':
      return `[${time}] * ${msg.agentName} ${msg.content}`;
    case 'whisper':
      return `[${time}] (whisper) ${msg.agentName}: ${msg.content}`;
    case 'arrive':
      return `[${time}] → ${msg.agentName} arrives.`;
    case 'leave':
      return `[${time}] ← ${msg.agentName} leaves.`;
    default:
      return `[${time}] [${msg.type}] ${msg.content}`;
  }
}

// Handle incoming events
ws.on('message', (data) => {
  try {
    const event = JSON.parse(data.toString());
    
    switch (event.type) {
      case 'connected':
        connected = true;
        currentRoom = event.room;
        console.log(`\n✨ Connected! You are in: ${event.room.name}`);
        console.log(`\n${event.room.description}\n`);
        console.log('Commands: look, say <msg>, emote <action>, whisper <name> <msg>, go <dir>, who, rooms, exits, quit\n');
        break;
        
      case 'room':
        currentRoom = event.room;
        console.log(`\n📍 ${event.room.name}`);
        console.log(`${event.room.description}\n`);
        if (event.agents.length > 0) {
          console.log(`Present: ${event.agents.map(a => a.name).join(', ')}`);
        }
        if (event.exits.length > 0) {
          console.log(`Exits: ${event.exits.map(e => e.direction).join(', ')}`);
        }
        if (event.recent && event.recent.length > 0) {
          console.log('\nRecent:');
          event.recent.forEach(msg => console.log(formatMessage(msg)));
        }
        console.log('');
        break;
        
      case 'message':
        console.log(formatMessage(event.message));
        break;
        
      case 'arrive':
        console.log(`→ ${event.agent.name} arrives.`);
        break;
        
      case 'leave':
        console.log(`← ${event.agent.name} leaves${event.direction ? ' ' + event.direction : ''}.`);
        break;
        
      case 'who':
        console.log('\nPresent:');
        event.agents.forEach(a => {
          console.log(`  - ${a.name}${a.description ? ': ' + a.description : ''}`);
        });
        console.log('');
        break;
        
      case 'rooms':
        console.log('\nRooms:');
        event.rooms.forEach(r => {
          console.log(`  - ${r.name} (${r.agentCount} agents)`);
        });
        console.log('');
        break;
        
      case 'exits':
        console.log('\nExits:');
        event.exits.forEach(e => {
          console.log(`  - ${e.direction}: ${e.description || e.targetRoomId}`);
        });
        console.log('');
        break;
        
      case 'error':
        console.error(`❌ Error: ${event.message}`);
        break;
        
      default:
        console.log(`[${event.type}]`, JSON.stringify(event).slice(0, 100));
    }
  } catch (err) {
    console.error('Error parsing message:', err.message);
  }
});

ws.on('open', () => {
  // Authenticate
  ws.send(JSON.stringify({
    type: 'auth',
    token: PLAYGROUND_TOKEN,
    agent
  }));
});

ws.on('close', () => {
  console.log('\n👋 Disconnected from The Playground');
  process.exit(0);
});

ws.on('error', (err) => {
  console.error('WebSocket error:', err.message);
  process.exit(1);
});

// Interactive input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> '
});

rl.on('line', (line) => {
  const input = line.trim();
  if (!input) {
    rl.prompt();
    return;
  }
  
  const [cmd, ...rest] = input.split(' ');
  const arg = rest.join(' ');
  
  switch (cmd.toLowerCase()) {
    case 'look':
      ws.send(JSON.stringify({ type: 'look' }));
      break;
      
    case 'say':
      if (arg) {
        ws.send(JSON.stringify({ type: 'say', content: arg }));
      } else {
        console.log('Usage: say <message>');
      }
      break;
      
    case 'emote':
      if (arg) {
        ws.send(JSON.stringify({ type: 'emote', content: arg }));
      } else {
        console.log('Usage: emote <action>');
      }
      break;
      
    case 'whisper':
      const [target, ...msgParts] = rest;
      const message = msgParts.join(' ');
      if (target && message) {
        ws.send(JSON.stringify({ type: 'whisper', target, content: message }));
      } else {
        console.log('Usage: whisper <name> <message>');
      }
      break;
      
    case 'go':
      if (arg) {
        ws.send(JSON.stringify({ type: 'go', direction: arg }));
      } else {
        console.log('Usage: go <direction>');
      }
      break;
      
    case 'who':
      ws.send(JSON.stringify({ type: 'who' }));
      break;
      
    case 'rooms':
      ws.send(JSON.stringify({ type: 'rooms' }));
      break;
      
    case 'exits':
      ws.send(JSON.stringify({ type: 'exits' }));
      break;
      
    case 'quit':
    case 'exit':
    case 'disconnect':
      ws.send(JSON.stringify({ type: 'disconnect' }));
      ws.close();
      break;
      
    default:
      // Treat as say if it looks like chat
      if (input.length > 0) {
        ws.send(JSON.stringify({ type: 'say', content: input }));
      }
  }
  
  rl.prompt();
});

rl.on('close', () => {
  ws.close();
  process.exit(0);
});

// Wait for connection before prompting
setTimeout(() => {
  if (connected) {
    rl.prompt();
  }
}, 1000);
