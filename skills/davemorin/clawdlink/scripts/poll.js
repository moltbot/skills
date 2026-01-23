#!/usr/bin/env node
/**
 * ClawdLink Poll
 * Check for new messages from the relay
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import relay from '../lib/relay.js';

const DATA_DIR = join(homedir(), '.clawdbot', 'clawdlink');
const IDENTITY_FILE = join(DATA_DIR, 'identity.json');
const FRIENDS_FILE = join(DATA_DIR, 'friends.json');
const INBOX_DIR = join(DATA_DIR, 'inbox');

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

function findFriendByKey(friends, publicKeyHex) {
  // Convert hex to base64 for comparison
  const keyBase64 = relay.hexToBase64(publicKeyHex);
  return friends.find(f => f.publicKey === keyBase64);
}

function saveToInbox(message, friend) {
  if (!existsSync(INBOX_DIR)) {
    mkdirSync(INBOX_DIR, { recursive: true });
  }
  const filename = `${Date.now()}-${friend?.displayName?.replace(/\s+/g, '_') || 'unknown'}.json`;
  writeFileSync(join(INBOX_DIR, filename), JSON.stringify(message, null, 2));
}

async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');
  const jsonOutput = args.includes('--json');

  if (!jsonOutput) {
    console.log('📥 ClawdLink Poll');
    console.log('='.repeat(50));
  }

  // Load identity and friends
  const identity = loadIdentity();
  const { friends } = loadFriends();

  try {
    // Poll relay for messages
    const messages = await relay.pollMessages(identity);

    if (messages.length === 0) {
      if (jsonOutput) {
        console.log(JSON.stringify({ messages: [], count: 0 }));
      } else {
        console.log('No new messages.');
      }
      return;
    }

    if (!jsonOutput) {
      console.log(`✓ Found ${messages.length} message(s)`);
      console.log('');
    }

    const decryptedMessages = [];

    for (const msg of messages) {
      // Find friend who sent this
      const friend = findFriendByKey(friends, msg.from);
      
      if (!friend) {
        if (verbose && !jsonOutput) {
          console.log(`⚠ Message from unknown sender: ${msg.from.slice(0, 16)}...`);
        }
        continue;
      }

      try {
        // Decrypt the message
        const content = relay.decryptMessage(msg, friend);
        
        const decrypted = {
          id: msg.id,
          from: friend.displayName,
          fromKey: friend.publicKey,
          content,
          receivedAt: new Date().toISOString(),
          relayTimestamp: msg.timestamp
        };

        decryptedMessages.push(decrypted);
        saveToInbox(decrypted, friend);

        if (!jsonOutput) {
          console.log(`📨 From: ${friend.displayName}`);
          console.log(`   Time: ${msg.timestamp}`);
          if (content.text) {
            console.log(`   Message: "${content.text}"`);
          } else {
            console.log(`   Type: ${content.type || 'unknown'}`);
          }
          console.log('');
        }

      } catch (err) {
        if (verbose && !jsonOutput) {
          console.log(`⚠ Failed to decrypt message from ${friend.displayName}: ${err.message}`);
        }
      }
    }

    if (jsonOutput) {
      console.log(JSON.stringify({ messages: decryptedMessages, count: decryptedMessages.length }));
    } else {
      console.log('='.repeat(50));
      console.log(`✓ Processed ${decryptedMessages.length} message(s)`);
    }

  } catch (err) {
    if (jsonOutput) {
      console.log(JSON.stringify({ error: err.message }));
    } else {
      console.error(`✗ Failed to poll: ${err.message}`);
    }
    process.exit(1);
  }
}

main().catch(console.error);
