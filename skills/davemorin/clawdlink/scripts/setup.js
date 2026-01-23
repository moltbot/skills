#!/usr/bin/env node
/**
 * ClawdLink Setup
 * Generates identity, sets up data directory, starts tunnel
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import crypto from '../lib/crypto.js';

const DATA_DIR = join(homedir(), '.clawdbot', 'clawdlink');
const IDENTITY_FILE = join(DATA_DIR, 'identity.json');
const FRIENDS_FILE = join(DATA_DIR, 'friends.json');
const CONFIG_FILE = join(DATA_DIR, 'config.json');

/**
 * Ensure data directory exists
 */
function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
    console.log(`✓ Created data directory: ${DATA_DIR}`);
  }
}

/**
 * Generate or load identity
 */
function setupIdentity() {
  if (existsSync(IDENTITY_FILE)) {
    const identity = JSON.parse(readFileSync(IDENTITY_FILE, 'utf8'));
    console.log(`✓ Loaded existing identity`);
    console.log(`  Public Key: ${identity.publicKey.slice(0, 20)}...`);
    return identity;
  }

  console.log('→ Generating new identity...');
  const identity = crypto.generateIdentity();
  const x25519 = crypto.ed25519ToX25519(identity.secretKey);
  
  const fullIdentity = {
    publicKey: identity.publicKey,
    secretKey: identity.secretKey,
    x25519PublicKey: x25519.publicKey,
    x25519SecretKey: x25519.secretKey,
    createdAt: new Date().toISOString()
  };

  writeFileSync(IDENTITY_FILE, JSON.stringify(fullIdentity, null, 2), { mode: 0o600 });
  console.log(`✓ Generated new identity`);
  console.log(`  Public Key: ${identity.publicKey.slice(0, 20)}...`);
  
  return fullIdentity;
}

/**
 * Initialize friends file
 */
function setupFriends() {
  if (!existsSync(FRIENDS_FILE)) {
    writeFileSync(FRIENDS_FILE, JSON.stringify({ friends: [] }, null, 2));
    console.log(`✓ Initialized friends list`);
  } else {
    const data = JSON.parse(readFileSync(FRIENDS_FILE, 'utf8'));
    console.log(`✓ Loaded ${data.friends?.length || 0} friends`);
  }
}

/**
 * Get or prompt for display name
 */
function setupConfig(name) {
  let config = {};
  if (existsSync(CONFIG_FILE)) {
    config = JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
  }

  if (name) {
    config.displayName = name;
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  }

  if (!config.displayName) {
    config.displayName = 'ClawdLink User';
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  }

  console.log(`✓ Display name: ${config.displayName}`);
  return config;
}

/**
 * Generate friend link
 */
function generateFriendLink(identity, config, tunnelUrl) {
  const params = new URLSearchParams({
    key: `ed25519:${identity.publicKey}`,
    name: config.displayName
  });
  return `clawdlink://${tunnelUrl}/add?${params.toString()}`;
}

/**
 * Main setup
 */
async function main() {
  console.log('🔗 ClawdLink Setup');
  console.log('='.repeat(50));

  const args = process.argv.slice(2);
  const nameArg = args.find(a => a.startsWith('--name='));
  const name = nameArg ? nameArg.split('=')[1] : null;

  ensureDataDir();
  const identity = setupIdentity();
  setupFriends();
  const config = setupConfig(name);

  console.log('');
  console.log('='.repeat(50));
  console.log('✓ ClawdLink setup complete!');
  console.log('');
  console.log('Next: Start the tunnel with `node scripts/tunnel.js`');
  console.log('');

  // Output identity info for Clawdbot to use
  console.log(JSON.stringify({
    status: 'ready',
    publicKey: identity.publicKey,
    displayName: config.displayName,
    dataDir: DATA_DIR
  }));
}

main().catch(console.error);
