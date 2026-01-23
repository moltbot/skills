#!/usr/bin/env node
/**
 * ClawdLink Install Script
 * 
 * Adds ClawdLink heartbeat polling to user's HEARTBEAT.md
 * Run after installing the skill: node scripts/install.js
 */

import { existsSync, readFileSync, writeFileSync, appendFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const CLAWD_DIR = join(homedir(), 'clawd');
const HEARTBEAT_FILE = join(CLAWD_DIR, 'HEARTBEAT.md');

const CLAWDLINK_SECTION = `
## ClawdLink
- Poll for encrypted messages: \`node ~/clawd/skills/clawdlink/heartbeat.js\`
- If output is non-empty, deliver it to the user
- Handles: messages, friend requests, acceptance notifications
`;

function main() {
  console.log('🔗 ClawdLink Install');
  console.log('='.repeat(50));
  
  // Check if HEARTBEAT.md exists
  if (!existsSync(HEARTBEAT_FILE)) {
    console.log('⚠ HEARTBEAT.md not found at', HEARTBEAT_FILE);
    console.log('  Create it manually and add ClawdLink section.');
    console.log('');
    console.log('Add this to your HEARTBEAT.md:');
    console.log(CLAWDLINK_SECTION);
    return;
  }
  
  // Check if already installed
  const content = readFileSync(HEARTBEAT_FILE, 'utf8');
  if (content.includes('ClawdLink') || content.includes('clawdlink')) {
    console.log('✓ ClawdLink already in HEARTBEAT.md');
    return;
  }
  
  // Append ClawdLink section
  appendFileSync(HEARTBEAT_FILE, CLAWDLINK_SECTION);
  console.log('✓ Added ClawdLink to HEARTBEAT.md');
  console.log('');
  console.log('ClawdLink will now poll for messages on each heartbeat.');
  console.log('');
  console.log('Next: Run setup if you haven\'t already:');
  console.log('  node cli.js setup "Your Name"');
}

main();
