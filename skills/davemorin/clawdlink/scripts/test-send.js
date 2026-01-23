#!/usr/bin/env node
/**
 * Send as the test user (Matt) to Dave
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import relay from '../lib/relay.js';
import crypto from '../lib/crypto.js';

const TEST_DIR = '/tmp/clawdlink-test';

const identity = JSON.parse(readFileSync(`${TEST_DIR}/identity.json`, 'utf8'));
identity.displayName = 'Matt Test';
const { friends } = JSON.parse(readFileSync(`${TEST_DIR}/friends.json`, 'utf8'));

const message = process.argv.slice(2).join(' ') || 'Hello from Matt! Testing reply.';

console.log('📤 Sending as Matt Test...');
console.log('='.repeat(50));

const friend = friends[0]; // Dave
if (!friend) {
  console.error('No friends to send to.');
  process.exit(1);
}

console.log(`→ To: ${friend.displayName}`);
console.log(`→ Message: "${message}"`);

const content = {
  type: 'message',
  text: message,
  timestamp: new Date().toISOString(),
  from: {
    name: 'Matt Test',
    key: identity.publicKey
  }
};

try {
  const result = await relay.sendMessage({
    to: friend.publicKey,
    content,
    identity,
    friend
  });
  
  console.log('');
  console.log('✓ Message sent!');
  console.log(`  ID: ${result.id}`);
  console.log(`  Time: ${result.timestamp}`);
} catch (err) {
  console.error('Error:', err.message);
}
