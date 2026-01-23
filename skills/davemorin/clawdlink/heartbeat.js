#!/usr/bin/env node
/**
 * ClawdLink Heartbeat Handler
 * 
 * Called periodically by Clawdbot heartbeat.
 * Respects delivery preferences, quiet hours, and batching.
 * Returns formatted messages in user's preferred style.
 * 
 * Usage: node heartbeat.js
 * Output: Markdown text if messages to deliver, empty if nothing
 */

import clawdbot from './lib/clawdbot.js';
import preferences from './lib/preferences.js';
import style from './lib/style.js';

async function main() {
  try {
    // Check if set up
    const status = await clawdbot.getStatus();
    if (!status.setup) {
      return; // Silent exit if not set up
    }
    
    // Load preferences
    const prefs = preferences.loadPreferences();
    
    // Check for messages and requests
    const result = await clawdbot.checkMessages();
    
    if (result.error) {
      console.error(`ClawdLink error: ${result.error}`);
      return;
    }
    
    const toDeliver = [];
    const toHold = [];
    
    // Process friend requests (always deliver immediately)
    if (result.requests?.length > 0) {
      for (const req of result.requests) {
        toDeliver.push({
          type: 'request',
          data: req,
          formatted: style.formatFriendRequest(req, prefs)
        });
      }
    }
    
    // Process accepted requests (always deliver immediately)
    if (result.accepted?.length > 0) {
      for (const acc of result.accepted) {
        toDeliver.push({
          type: 'accepted',
          data: acc,
          formatted: style.formatAcceptance(acc, prefs)
        });
      }
    }
    
    // Process messages with delivery preferences
    if (result.messages?.length > 0) {
      for (const msg of result.messages) {
        const decision = preferences.shouldDeliverNow(msg, prefs);
        
        if (decision.deliver) {
          toDeliver.push({
            type: 'message',
            data: msg,
            formatted: style.formatForDelivery(msg, prefs)
          });
        } else {
          // Hold for later
          preferences.holdMessage(msg, decision.reason);
          toHold.push(msg);
        }
      }
    }
    
    // Check if it's batch delivery time and we have held messages
    if (preferences.isBatchDeliveryTime(prefs)) {
      const held = preferences.loadHeldMessages();
      if (held.length > 0) {
        toDeliver.push({
          type: 'batch',
          data: held,
          formatted: style.formatBatch(held, prefs)
        });
        // Clear held messages
        preferences.saveHeldMessages([]);
      }
    }
    
    // Output if there's anything to deliver
    if (toDeliver.length > 0) {
      const outputs = toDeliver.map(item => item.formatted);
      console.log(outputs.join('\n\n---\n\n'));
    }
    
    // Log holds (for debugging, stderr so it doesn't affect output)
    if (toHold.length > 0) {
      console.error(`ClawdLink: Held ${toHold.length} message(s) for later delivery`);
    }
    
  } catch (err) {
    console.error(`ClawdLink heartbeat error: ${err.message}`);
  }
}

main();
