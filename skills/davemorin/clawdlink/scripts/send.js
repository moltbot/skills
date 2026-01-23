#!/usr/bin/env node
/**
 * ClawdLink Send
 * Send an encrypted message to a friend via the relay
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import crypto from '../lib/crypto.js';
import relay from '../lib/relay.js';

const DATA_DIR = join(homedir(), '.clawdbot', 'clawdlink');
const IDENTITY_FILE = join(DATA_DIR, 'identity.json');
const FRIENDS_FILE = join(DATA_DIR, 'friends.json');
const OUTBOX_DIR = join(DATA_DIR, 'outbox');

function loadIdentity() {
  if (!existsSync(IDENTITY_FILE)) {
    throw new Error('No identity found. Run setup first.');
  }
  return JSON.parse(readFileSync(IDENTITY_FILE, 'utf8'));
}

function loadFriends() {
  if (!existsSync(FRIENDS_FILE)) {
    return { friends: [] };
  }
  return JSON.parse(readFileSync(FRIENDS_FILE, 'utf8'));
}

function findFriend(friends, nameOrKey) {
  const query = nameOrKey.toLowerCase();
  return friends.find(f => 
    f.displayName?.toLowerCase().includes(query) ||
    f.publicKey?.toLowerCase().includes(query)
  );
}

function saveToOutbox(message, friend) {
  if (!existsSync(OUTBOX_DIR)) {
    mkdirSync(OUTBOX_DIR, { recursive: true });
  }
  const filename = `${Date.now()}-${friend.displayName.replace(/\s+/g, '_')}.json`;
  writeFileSync(join(OUTBOX_DIR, filename), JSON.stringify(message, null, 2));
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node send.js <friend-name> <message>');
    console.log('');
    console.log('Example:');
    console.log('  node send.js "Matt" "Hey, want to jam on AI agents?"');
    process.exit(1);
  }

  const friendName = args[0];
  const messageText = args.slice(1).join(' ');

  console.log('📤 ClawdLink Send');
  console.log('='.repeat(50));

  // Load identity and friends
  const identity = loadIdentity();
  const { friends } = loadFriends();

  // Find the friend
  const friend = findFriend(friends, friendName);
  if (!friend) {
    console.error(`✗ Friend not found: ${friendName}`);
    console.log('');
    console.log('Available friends:');
    friends.forEach(f => console.log(`  • ${f.displayName}`));
    process.exit(1);
  }

  if (friend.status !== 'connected') {
    console.error(`✗ Friend ${friend.displayName} is not connected yet (status: ${friend.status})`);
    process.exit(1);
  }

  console.log(`→ Sending to: ${friend.displayName}`);
  console.log(`→ Message: "${messageText.slice(0, 50)}${messageText.length > 50 ? '...' : ''}"`);

  // Build message envelope
  const content = {
    type: 'message',
    text: messageText,
    timestamp: new Date().toISOString(),
    from: {
      name: identity.displayName || 'Unknown',
      key: identity.publicKey
    }
  };

  try {
    // Send via relay
    const result = await relay.sendMessage({
      to: friend.publicKey,
      content,
      identity,
      friend
    });

    console.log('');
    console.log(`✓ Message sent!`);
    console.log(`  ID: ${result.id}`);
    console.log(`  Time: ${result.timestamp}`);

    // Save to outbox for record
    saveToOutbox({
      id: result.id,
      to: friend.displayName,
      toKey: friend.publicKey,
      content,
      sentAt: result.timestamp
    }, friend);

  } catch (err) {
    console.error(`✗ Failed to send: ${err.message}`);
    process.exit(1);
  }
}

main().catch(console.error);
