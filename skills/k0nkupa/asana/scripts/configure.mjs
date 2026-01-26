#!/usr/bin/env node
/**
 * Configure local-only Asana OAuth credentials for the Clawdbot Asana skill.
 *
 * Writes to: ~/.clawdbot/asana/credentials.json
 *
 * Usage:
 *   node skills/asana/scripts/configure.mjs --client-id "..." --client-secret "..."
 *
 * Notes:
 * - Keep this file secret.
 * - You can also set ASANA_CLIENT_ID / ASANA_CLIENT_SECRET as environment variables instead.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function die(msg) {
  console.error(msg);
  process.exit(1);
}

function parseArgs(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      flags[k] = v;
    }
  }
  return flags;
}

const flags = parseArgs(process.argv.slice(2));
const clientId = flags['client-id'] || process.env.ASANA_CLIENT_ID;
const clientSecret = flags['client-secret'] || process.env.ASANA_CLIENT_SECRET;

if (!clientId) die('Missing --client-id (or ASANA_CLIENT_ID)');
if (!clientSecret) die('Missing --client-secret (or ASANA_CLIENT_SECRET)');

const outPath = path.join(os.homedir(), '.clawdbot', 'asana', 'credentials.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify({ client_id: String(clientId), client_secret: String(clientSecret) }, null, 2));
console.log(`Saved Asana OAuth credentials to: ${outPath}`);
