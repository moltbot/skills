#!/usr/bin/env node
/**
 * Poll as the test user (Matt) to receive messages
 */

import { readFileSync } from 'fs';
import relay from '../lib/relay.js';

const TEST_DIR = '/tmp/clawdlink-test';

const identity = JSON.parse(readFileSync(`${TEST_DIR}/identity.json`, 'utf8'));
const { friends } = JSON.parse(readFileSync(`${TEST_DIR}/friends.json`, 'utf8'));

console.log('📥 Polling as Matt Test...');
console.log('='.repeat(50));

try {
  const messages = await relay.pollMessages(identity);
  
  if (messages.length === 0) {
    console.log('No messages.');
  } else {
    console.log(`Found ${messages.length} message(s):`);
    console.log('');
    
    for (const msg of messages) {
      // Find the friend who sent this
      const friend = friends.find(f => relay.base64ToHex(f.publicKey) === msg.from);
      
      if (friend) {
        const content = relay.decryptMessage(msg, friend);
        console.log(`From: ${friend.displayName}`);
        console.log(`Time: ${msg.timestamp}`);
        console.log(`Message: "${content.text}"`);
      } else {
        console.log(`From: Unknown (${msg.from.slice(0, 16)}...)`);
      }
      console.log('');
    }
  }
} catch (err) {
  console.error('Error:', err.message);
}
