#!/usr/bin/env node
/**
 * Test the friend request flow
 * Simulates Sophie sending Dave a friend request via the new endpoint
 */

import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import crypto from '../lib/crypto.js';
import relay from '../lib/relay.js';

const SOPHIE_DIR = '/tmp/clawdlink-sophie';
const DAVE_DATA_DIR = join(homedir(), '.clawdbot', 'clawdlink');

// Create Sophie's identity
mkdirSync(SOPHIE_DIR, { recursive: true });

const sophieIdentity = crypto.generateIdentity();
const sophieX25519 = crypto.ed25519ToX25519(sophieIdentity.secretKey);

const sophieData = {
  publicKey: sophieIdentity.publicKey,
  secretKey: sophieIdentity.secretKey,
  x25519PublicKey: sophieX25519.publicKey,
  x25519SecretKey: sophieX25519.secretKey,
  createdAt: new Date().toISOString()
};

writeFileSync(join(SOPHIE_DIR, 'identity.json'), JSON.stringify(sophieData, null, 2));
writeFileSync(join(SOPHIE_DIR, 'config.json'), JSON.stringify({ displayName: 'Sophie Bakalar' }, null, 2));
writeFileSync(join(SOPHIE_DIR, 'friends.json'), JSON.stringify({ friends: [] }, null, 2));

console.log('🧪 Created Sophie Bakalar identity');
console.log('');

// Load Dave's identity
const daveIdentity = JSON.parse(readFileSync(join(DAVE_DATA_DIR, 'identity.json'), 'utf8'));

// Sophie sends a friend request to Dave
console.log('→ Sophie sending friend request to Dave...');

const fromHex = relay.base64ToHex(sophieIdentity.publicKey);
const toHex = relay.base64ToHex(daveIdentity.publicKey);
const fromX25519Hex = relay.base64ToHex(sophieX25519.publicKey);
const message = "Hey Dave! Let's connect our Clawdbots so we can coordinate on the podcast.";
const fromName = 'Sophie Bakalar';

const signPayload = `${fromHex}:${toHex}:${fromName}:${message}`;
const signature = crypto.sign(signPayload, sophieIdentity.secretKey);

const response = await fetch(`${relay.RELAY_URL}/request`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: fromHex,
    to: toHex,
    fromName,
    fromX25519: fromX25519Hex,
    message,
    signature: relay.base64ToHex(signature)
  })
});

const result = await response.json();
if (result.error) {
  console.error('Error:', result.error);
} else {
  console.log('✓ Friend request sent!');
  console.log('  ID:', result.id);
  console.log('');
  console.log('Now run: node handler.js check');
  console.log('You should see the friend request from Sophie.');
}
