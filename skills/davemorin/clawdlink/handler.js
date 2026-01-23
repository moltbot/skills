#!/usr/bin/env node
/**
 * ClawdLink Handler
 * JSON API for Clawdbot integration
 * 
 * Usage: node handler.js <action> [args...]
 * Output: JSON result
 */

import clawdbot from './lib/clawdbot.js';
import prefs from './lib/preferences.js';

const args = process.argv.slice(2);
const action = args[0];

// Parse --key=value or --key value flags
function parseFlags(args) {
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      if (key.includes('=')) {
        const [k, v] = key.split('=');
        flags[k] = v;
      } else if (args[i + 1] && !args[i + 1].startsWith('--')) {
        flags[key] = args[++i];
      } else {
        flags[key] = true;
      }
    }
  }
  return flags;
}

async function main() {
  let result;
  const flags = parseFlags(args);

  switch (action) {
    case 'check':
      // Check for new messages and friend requests
      result = await clawdbot.checkMessages();
      break;

    case 'send':
      // Send message: node handler.js send "Friend" "Message" [--urgent] [--context=work]
      if (args.length < 3) {
        result = { success: false, error: 'Usage: send <friend> <message> [--urgent] [--context=work|personal|social]' };
      } else {
        const options = {
          urgency: flags.urgent ? 'urgent' : (flags.fyi ? 'fyi' : 'normal'),
          context: flags.context || 'personal',
          respondBy: flags.respondBy || null
        };
        result = await clawdbot.sendToFriend(args[1], args[2], options);
      }
      break;

    case 'add':
      // Add friend: node handler.js add "clawdlink://..." ["optional message"]
      if (!args[1]) {
        result = { success: false, error: 'Usage: add <friend-link> [message]' };
      } else {
        result = await clawdbot.addFriend(args[1], args[2] || '');
      }
      break;

    case 'accept':
      // Accept friend request: node handler.js accept "Friend Name"
      if (!args[1]) {
        result = { success: false, error: 'Usage: accept <friend-name>' };
      } else {
        result = await clawdbot.acceptFriend(args[1]);
      }
      break;

    case 'link':
      // Get friend link
      result = clawdbot.getFriendLink();
      break;

    case 'friends':
      // List friends
      result = clawdbot.listFriends();
      break;

    case 'status':
      // Get status
      result = await clawdbot.getStatus();
      break;

    case 'preferences':
    case 'prefs':
      // Get or set preferences
      if (!args[1]) {
        result = { preferences: prefs.loadPreferences() };
      } else if (args[1] === 'set' && args[2] && args[3]) {
        let value = args[3];
        try { value = JSON.parse(value); } catch {}
        prefs.updatePreference(args[2], value);
        result = { success: true, path: args[2], value };
      } else {
        result = { error: 'Usage: preferences [set <path> <value>]' };
      }
      break;

    case 'quiet-hours':
      if (args[1] === 'on') {
        prefs.updatePreference('schedule.quietHours.enabled', true);
        result = { success: true, quietHours: 'enabled' };
      } else if (args[1] === 'off') {
        prefs.updatePreference('schedule.quietHours.enabled', false);
        result = { success: true, quietHours: 'disabled' };
      } else if (args[1] && args[2]) {
        prefs.updatePreference('schedule.quietHours.enabled', true);
        prefs.updatePreference('schedule.quietHours.start', args[1]);
        prefs.updatePreference('schedule.quietHours.end', args[2]);
        result = { success: true, quietHours: { start: args[1], end: args[2] } };
      } else {
        const p = prefs.loadPreferences();
        result = { quietHours: p.schedule.quietHours };
      }
      break;

    case 'batch':
      if (args[1] === 'on') {
        prefs.updatePreference('schedule.batchDelivery.enabled', true);
        result = { success: true, batch: 'enabled' };
      } else if (args[1] === 'off') {
        prefs.updatePreference('schedule.batchDelivery.enabled', false);
        result = { success: true, batch: 'disabled' };
      } else {
        const p = prefs.loadPreferences();
        result = { batchDelivery: p.schedule.batchDelivery };
      }
      break;

    case 'tone':
      const validTones = ['natural', 'casual', 'formal', 'brief'];
      if (args[1] && validTones.includes(args[1])) {
        prefs.updatePreference('style.tone', args[1]);
        result = { success: true, tone: args[1] };
      } else {
        const p = prefs.loadPreferences();
        result = { tone: p.style.tone, valid: validTones };
      }
      break;

    default:
      result = {
        error: 'Unknown action',
        usage: {
          check: 'Check for messages and friend requests',
          send: 'send <friend> <message> [--urgent] [--context=work]',
          add: 'add <friend-link> [message]',
          accept: 'accept <friend-name>',
          link: 'Get your friend link',
          friends: 'List friends',
          status: 'Get ClawdLink status',
          preferences: 'preferences [set <path> <value>]',
          'quiet-hours': 'quiet-hours [on|off|<start> <end>]',
          batch: 'batch [on|off]',
          tone: 'tone [natural|casual|formal|brief]'
        }
      };
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch(err => {
  console.log(JSON.stringify({ error: err.message }));
  process.exit(1);
});
