#!/usr/bin/env node
/**
 * ClawdLink Friends Manager
 * Add, list, and manage friends
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import crypto from '../lib/crypto.js';

const DATA_DIR = join(homedir(), '.clawdbot', 'clawdlink');
const IDENTITY_FILE = join(DATA_DIR, 'identity.json');
const FRIENDS_FILE = join(DATA_DIR, 'friends.json');
const CONFIG_FILE = join(DATA_DIR, 'config.json');

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

function saveFriends(data) {
  writeFileSync(FRIENDS_FILE, JSON.stringify(data, null, 2));
}

function loadConfig() {
  if (!existsSync(CONFIG_FILE)) {
    return { displayName: 'ClawdLink User' };
  }
  return JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
}

/**
 * Parse a friend link
 * Format: clawdlink://<relay-url>/add?key=ed25519:<pubkey>&name=<name>
 */
function parseFriendLink(link) {
  try {
    // Handle both clawdlink:// and https:// formats
    const url = new URL(link.replace('clawdlink://', 'https://'));
    const params = new URLSearchParams(url.search);
    
    let key = params.get('key') || '';
    const name = params.get('name') || 'Unknown';
    
    // Remove ed25519: prefix if present
    if (key.startsWith('ed25519:')) {
      key = key.slice(8);
    }
    
    if (!key) {
      throw new Error('No public key found in link');
    }
    
    return { publicKey: key, displayName: decodeURIComponent(name) };
  } catch (err) {
    throw new Error(`Invalid friend link: ${err.message}`);
  }
}

/**
 * Generate your friend link
 */
function generateFriendLink(identity, config) {
  const params = new URLSearchParams({
    key: `ed25519:${identity.publicKey}`,
    name: config.displayName
  });
  return `clawdlink://relay.clawdlink.bot/add?${params.toString()}`;
}

/**
 * Add a friend
 */
function addFriend(link) {
  const identity = loadIdentity();
  const data = loadFriends();
  
  // Parse the friend link
  const { publicKey, displayName } = parseFriendLink(link);
  
  // Check if already added
  const existing = data.friends.find(f => f.publicKey === publicKey);
  if (existing) {
    console.log(`✓ ${displayName} is already your friend.`);
    return;
  }
  
  // Derive shared secret for encryption
  const theirX25519Public = crypto.ed25519ToX25519({ secretKey: identity.secretKey, publicKey }).publicKey;
  // For now, use the friend's public key directly (they'll derive same secret)
  // In a full implementation, we'd do proper X25519 key exchange
  const sharedSecret = crypto.deriveSharedSecret(identity.x25519SecretKey, publicKey);
  
  // Add friend
  const friend = {
    displayName,
    publicKey,
    sharedSecret: Buffer.from(sharedSecret).toString('base64'),
    addedAt: new Date().toISOString(),
    status: 'connected'  // With relay, we're always "connected"
  };
  
  data.friends.push(friend);
  saveFriends(data);
  
  console.log(`✓ Added friend: ${displayName}`);
  console.log(`  Public Key: ${publicKey.slice(0, 20)}...`);
}

/**
 * List friends
 */
function listFriends() {
  const data = loadFriends();
  
  if (data.friends.length === 0) {
    console.log('No friends yet.');
    console.log('');
    console.log('To add a friend, share your friend link with them:');
    showLink();
    return;
  }
  
  console.log(`Friends (${data.friends.length}):`);
  console.log('');
  
  for (const friend of data.friends) {
    console.log(`  • ${friend.displayName}`);
    console.log(`    Key: ${friend.publicKey.slice(0, 20)}...`);
    console.log(`    Status: ${friend.status}`);
    console.log(`    Added: ${friend.addedAt}`);
    console.log('');
  }
}

/**
 * Remove a friend
 */
function removeFriend(nameOrKey) {
  const data = loadFriends();
  const query = nameOrKey.toLowerCase();
  
  const index = data.friends.findIndex(f => 
    f.displayName?.toLowerCase().includes(query) ||
    f.publicKey?.toLowerCase().includes(query)
  );
  
  if (index === -1) {
    console.error(`✗ Friend not found: ${nameOrKey}`);
    return;
  }
  
  const friend = data.friends[index];
  data.friends.splice(index, 1);
  saveFriends(data);
  
  console.log(`✓ Removed friend: ${friend.displayName}`);
}

/**
 * Show your friend link
 */
function showLink() {
  const identity = loadIdentity();
  const config = loadConfig();
  const link = generateFriendLink(identity, config);
  
  console.log('Your friend link:');
  console.log('');
  console.log(`  ${link}`);
  console.log('');
  console.log('Share this with friends so they can add you.');
}

// Main
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'add':
    if (!args[1]) {
      console.error('Usage: friends.js add <friend-link>');
      process.exit(1);
    }
    addFriend(args[1]);
    break;
    
  case 'list':
    listFriends();
    break;
    
  case 'remove':
    if (!args[1]) {
      console.error('Usage: friends.js remove <name>');
      process.exit(1);
    }
    removeFriend(args[1]);
    break;
    
  case 'link':
    showLink();
    break;
    
  default:
    console.log('ClawdLink Friends Manager');
    console.log('');
    console.log('Commands:');
    console.log('  add <link>     Add a friend from their link');
    console.log('  list           List all friends');
    console.log('  remove <name>  Remove a friend');
    console.log('  link           Show your friend link');
}
