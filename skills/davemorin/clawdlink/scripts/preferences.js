#!/usr/bin/env node
/**
 * ClawdLink Preferences Manager
 * 
 * Configure delivery preferences interactively or via command line.
 */

import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import prefs from '../lib/preferences.js';

const DATA_DIR = join(homedir(), '.clawdbot', 'clawdlink');
const IDENTITY_FILE = join(DATA_DIR, 'identity.json');

const args = process.argv.slice(2);
const command = args[0];

function showPreferences() {
  const p = prefs.loadPreferences();
  console.log(JSON.stringify(p, null, 2));
}

function showHelp() {
  console.log(`
🔗 ClawdLink Preferences

Commands:
  show                        Show all preferences
  set <path> <value>          Set a preference value
  quiet-hours <on|off>        Enable/disable quiet hours
  quiet-hours <start> <end>   Set quiet hours (e.g., 22:00 08:00)
  batch <on|off>              Enable/disable batch delivery
  batch-times <time1,time2>   Set batch times (e.g., 09:00,18:00)
  tone <natural|casual|formal|brief>  Set communication tone
  friend <name> priority <high|normal>  Set friend priority
  friend <name> always-deliver <on|off>  Always deliver from friend
  timezone <tz>               Set timezone (e.g., America/Los_Angeles)

Examples:
  node preferences.js show
  node preferences.js quiet-hours on
  node preferences.js quiet-hours 22:00 07:00
  node preferences.js batch on
  node preferences.js batch-times 08:00,12:00,18:00
  node preferences.js tone casual
  node preferences.js friend "Sophie" priority high
  node preferences.js timezone America/New_York
`);
}

function main() {
  if (!existsSync(IDENTITY_FILE)) {
    console.error('ClawdLink not set up. Run: node cli.js setup "Your Name"');
    process.exit(1);
  }

  switch (command) {
    case 'show':
      showPreferences();
      break;

    case 'set':
      if (args.length < 3) {
        console.error('Usage: set <path> <value>');
        process.exit(1);
      }
      const path = args[1];
      let value = args.slice(2).join(' ');
      // Try to parse as JSON
      try {
        value = JSON.parse(value);
      } catch {
        // Keep as string
      }
      prefs.updatePreference(path, value);
      console.log(`✓ Set ${path} = ${JSON.stringify(value)}`);
      break;

    case 'quiet-hours':
      if (args[1] === 'on') {
        prefs.updatePreference('schedule.quietHours.enabled', true);
        console.log('✓ Quiet hours enabled');
      } else if (args[1] === 'off') {
        prefs.updatePreference('schedule.quietHours.enabled', false);
        console.log('✓ Quiet hours disabled');
      } else if (args[1] && args[2]) {
        prefs.updatePreference('schedule.quietHours.enabled', true);
        prefs.updatePreference('schedule.quietHours.start', args[1]);
        prefs.updatePreference('schedule.quietHours.end', args[2]);
        console.log(`✓ Quiet hours set: ${args[1]} - ${args[2]}`);
      } else {
        const p = prefs.loadPreferences();
        const qh = p.schedule.quietHours;
        console.log(`Quiet hours: ${qh.enabled ? 'on' : 'off'} (${qh.start} - ${qh.end})`);
      }
      break;

    case 'batch':
      if (args[1] === 'on') {
        prefs.updatePreference('schedule.batchDelivery.enabled', true);
        console.log('✓ Batch delivery enabled');
      } else if (args[1] === 'off') {
        prefs.updatePreference('schedule.batchDelivery.enabled', false);
        console.log('✓ Batch delivery disabled');
      } else {
        const p = prefs.loadPreferences();
        const bd = p.schedule.batchDelivery;
        console.log(`Batch delivery: ${bd.enabled ? 'on' : 'off'} at ${bd.times.join(', ')}`);
      }
      break;

    case 'batch-times':
      if (!args[1]) {
        console.error('Usage: batch-times <time1,time2,...>');
        process.exit(1);
      }
      const times = args[1].split(',').map(t => t.trim());
      prefs.updatePreference('schedule.batchDelivery.times', times);
      console.log(`✓ Batch times set: ${times.join(', ')}`);
      break;

    case 'tone':
      const validTones = ['natural', 'casual', 'formal', 'brief'];
      if (!args[1] || !validTones.includes(args[1])) {
        console.error(`Usage: tone <${validTones.join('|')}>`);
        process.exit(1);
      }
      prefs.updatePreference('style.tone', args[1]);
      console.log(`✓ Tone set to: ${args[1]}`);
      break;

    case 'friend':
      if (!args[1]) {
        console.error('Usage: friend <name> <setting> <value>');
        process.exit(1);
      }
      const friendName = args[1];
      const setting = args[2];
      const settingValue = args[3];
      
      if (setting === 'priority') {
        prefs.setFriendPrefs(friendName, { priority: settingValue });
        console.log(`✓ ${friendName}: priority = ${settingValue}`);
      } else if (setting === 'always-deliver') {
        prefs.setFriendPrefs(friendName, { alwaysDeliver: settingValue === 'on' });
        console.log(`✓ ${friendName}: always-deliver = ${settingValue}`);
      } else {
        console.error('Unknown friend setting. Use: priority or always-deliver');
      }
      break;

    case 'timezone':
      if (!args[1]) {
        const p = prefs.loadPreferences();
        console.log(`Timezone: ${p.schedule.timezone}`);
      } else {
        prefs.updatePreference('schedule.timezone', args[1]);
        console.log(`✓ Timezone set to: ${args[1]}`);
      }
      break;

    default:
      showHelp();
  }
}

main();
