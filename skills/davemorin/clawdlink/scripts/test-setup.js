#!/usr/bin/env node
/**
 * Create a test identity for testing ClawdLink
 */

import crypto from '../lib/crypto.js';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const TEST_DIR = '/tmp/clawdlink-test';
const REAL_DATA_DIR = join(homedir(), '.clawdbot', 'clawdlink');

// Create test identity
mkdirSync(TEST_DIR, { recursive: true });

const identity = crypto.generateIdentity();
const x25519 = crypto.ed25519ToX25519(identity.secretKey);

const fullIdentity = {
  publicKey: identity.publicKey,
  secretKey: identity.secretKey,
  x25519PublicKey: x25519.publicKey,
  x25519SecretKey: x25519.secretKey,
  createdAt: new Date().toISOString()
};

writeFileSync(join(TEST_DIR, 'identity.json'), JSON.stringify(fullIdentity, null, 2));
writeFileSync(join(TEST_DIR, 'config.json'), JSON.stringify({ displayName: 'Matt Test' }, null, 2));
writeFileSync(join(TEST_DIR, 'friends.json'), JSON.stringify({ friends: [] }, null, 2));

console.log('🧪 Test Identity Created');
console.log('='.repeat(50));
console.log('Name: Matt Test');
console.log('Public Key:', identity.publicKey);
console.log('X25519 Public Key:', x25519.publicKey);
console.log('');

// Load Dave's identity
const daveIdentity = JSON.parse(readFileSync(join(REAL_DATA_DIR, 'identity.json'), 'utf8'));
const daveConfig = existsSync(join(REAL_DATA_DIR, 'config.json')) 
  ? JSON.parse(readFileSync(join(REAL_DATA_DIR, 'config.json'), 'utf8'))
  : { displayName: 'Dave' };

// Now add each other as friends using X25519 keys for shared secret
const daveFriends = JSON.parse(readFileSync(join(REAL_DATA_DIR, 'friends.json'), 'utf8'));

// Derive shared secret (Dave's perspective) - use X25519 keys
const daveSharedSecret = crypto.deriveSharedSecret(daveIdentity.x25519SecretKey, x25519.publicKey);

const mattAsFriend = {
  displayName: 'Matt Test',
  publicKey: identity.publicKey,
  x25519PublicKey: x25519.publicKey,
  sharedSecret: Buffer.from(daveSharedSecret).toString('base64'),
  addedAt: new Date().toISOString(),
  status: 'connected'
};

// Check if Matt already exists
const existingMatt = daveFriends.friends.findIndex(f => f.displayName === 'Matt Test');
if (existingMatt >= 0) {
  daveFriends.friends[existingMatt] = mattAsFriend;
} else {
  daveFriends.friends.push(mattAsFriend);
}
writeFileSync(join(REAL_DATA_DIR, 'friends.json'), JSON.stringify(daveFriends, null, 2));

// Add Dave to Matt's friends - use X25519 keys
const mattSharedSecret = crypto.deriveSharedSecret(x25519.secretKey, daveIdentity.x25519PublicKey);

const mattFriends = {
  friends: [{
    displayName: daveConfig.displayName,
    publicKey: daveIdentity.publicKey,
    x25519PublicKey: daveIdentity.x25519PublicKey,
    sharedSecret: Buffer.from(mattSharedSecret).toString('base64'),
    addedAt: new Date().toISOString(),
    status: 'connected'
  }]
};
writeFileSync(join(TEST_DIR, 'friends.json'), JSON.stringify(mattFriends, null, 2));

console.log('✓ Added Matt Test to Dave\'s friends');
console.log('✓ Added Dave to Matt Test\'s friends');
console.log('');
console.log('Ready to test! Try:');
console.log('  node cli.js send "Matt Test" "Hello from Dave!"');
