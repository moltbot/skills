/**
 * ClawdLink Delivery Preferences
 * 
 * Controls how and when messages are delivered to the user.
 * Respects quiet hours, batching, urgency, and personal style.
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const DATA_DIR = join(homedir(), '.clawdbot', 'clawdlink');
const PREFS_FILE = join(DATA_DIR, 'preferences.json');
const HELD_FILE = join(DATA_DIR, 'held_messages.json');

const DEFAULT_PREFERENCES = {
  // Schedule
  schedule: {
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "08:00"
    },
    batchDelivery: {
      enabled: false,
      times: ["09:00", "18:00"]  // Deliver batched messages at these times
    },
    timezone: "America/Los_Angeles"
  },
  
  // Delivery rules
  delivery: {
    allowUrgentDuringQuiet: true,
    summarizeFirst: true,      // Show summary before full message
    includeContext: true,      // Include sender's context/reason
    maxPerDelivery: 10         // Don't overwhelm with too many at once
  },
  
  // Communication style
  style: {
    tone: "natural",           // natural | formal | casual | brief
    voice: null,               // Custom voice description
    rewriteMessages: false,    // Adapt messages to my style
    greetingStyle: "friendly"  // How Clawdbot introduces messages
  },
  
  // Per-friend overrides
  friends: {
    // "Friend Name": { priority: "high", alwaysDeliver: true, customTone: "casual" }
  },
  
  // Context preferences
  context: {
    workHours: { start: "09:00", end: "18:00" },
    preferredContexts: ["personal", "work", "social"],  // In priority order
    muteContexts: []  // Contexts to always batch
  }
};

/**
 * Load preferences (with defaults)
 */
export function loadPreferences() {
  if (!existsSync(PREFS_FILE)) {
    return { ...DEFAULT_PREFERENCES };
  }
  
  const saved = JSON.parse(readFileSync(PREFS_FILE, 'utf8'));
  // Merge with defaults to ensure all fields exist
  return deepMerge(DEFAULT_PREFERENCES, saved);
}

/**
 * Save preferences
 */
export function savePreferences(prefs) {
  writeFileSync(PREFS_FILE, JSON.stringify(prefs, null, 2));
}

/**
 * Update specific preference
 */
export function updatePreference(path, value) {
  const prefs = loadPreferences();
  setNestedValue(prefs, path, value);
  savePreferences(prefs);
  return prefs;
}

/**
 * Load held messages (messages waiting for delivery)
 */
export function loadHeldMessages() {
  if (!existsSync(HELD_FILE)) {
    return [];
  }
  return JSON.parse(readFileSync(HELD_FILE, 'utf8'));
}

/**
 * Save held messages
 */
export function saveHeldMessages(messages) {
  writeFileSync(HELD_FILE, JSON.stringify(messages, null, 2));
}

/**
 * Hold a message for later delivery
 */
export function holdMessage(message, reason) {
  const held = loadHeldMessages();
  held.push({
    ...message,
    heldAt: new Date().toISOString(),
    heldReason: reason
  });
  saveHeldMessages(held);
}

/**
 * Check if current time is in quiet hours
 */
export function isQuietHours(prefs) {
  if (!prefs.schedule.quietHours.enabled) return false;
  
  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: prefs.schedule.timezone 
  });
  
  const start = prefs.schedule.quietHours.start;
  const end = prefs.schedule.quietHours.end;
  
  // Handle overnight quiet hours (e.g., 22:00 - 08:00)
  if (start > end) {
    return currentTime >= start || currentTime < end;
  }
  return currentTime >= start && currentTime < end;
}

/**
 * Check if current time is a batch delivery time
 */
export function isBatchDeliveryTime(prefs) {
  if (!prefs.schedule.batchDelivery.enabled) return false;
  
  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: prefs.schedule.timezone 
  });
  
  // Check if within 5 minutes of a batch time
  for (const batchTime of prefs.schedule.batchDelivery.times) {
    const [batchHour, batchMin] = batchTime.split(':').map(Number);
    const [currentHour, currentMin] = currentTime.split(':').map(Number);
    
    const batchMinutes = batchHour * 60 + batchMin;
    const currentMinutes = currentHour * 60 + currentMin;
    
    if (Math.abs(currentMinutes - batchMinutes) <= 5) {
      return true;
    }
  }
  return false;
}

/**
 * Determine if a message should be delivered now
 */
export function shouldDeliverNow(message, prefs) {
  const friendName = message.from;
  const friendPrefs = prefs.friends[friendName] || {};
  const urgency = message.content?.urgency || 'normal';
  const context = message.content?.context || 'personal';
  
  // Friend-specific override: always deliver
  if (friendPrefs.alwaysDeliver) {
    return { deliver: true, reason: 'Friend marked as always deliver' };
  }
  
  // Quiet hours check
  if (isQuietHours(prefs)) {
    if (urgency === 'urgent' && prefs.delivery.allowUrgentDuringQuiet) {
      return { deliver: true, reason: 'Urgent message during quiet hours' };
    }
    return { deliver: false, reason: 'Quiet hours', holdUntil: 'quiet_end' };
  }
  
  // Batch delivery check
  if (prefs.schedule.batchDelivery.enabled) {
    // Check if friend is excluded from batching
    if (friendPrefs.priority === 'high') {
      return { deliver: true, reason: 'High priority friend' };
    }
    
    // Check if it's batch delivery time
    if (isBatchDeliveryTime(prefs)) {
      return { deliver: true, reason: 'Batch delivery time' };
    }
    
    // Check if context should be batched
    if (prefs.context.muteContexts.includes(context)) {
      return { deliver: false, reason: 'Context set to batch', holdUntil: 'batch_time' };
    }
    
    // If batching is on but not urgent, hold
    if (urgency !== 'urgent') {
      return { deliver: false, reason: 'Batch delivery enabled', holdUntil: 'batch_time' };
    }
  }
  
  // Default: deliver
  return { deliver: true, reason: 'Default delivery' };
}

/**
 * Get friend-specific preferences
 */
export function getFriendPrefs(friendName) {
  const prefs = loadPreferences();
  return prefs.friends[friendName] || {};
}

/**
 * Set friend-specific preferences
 */
export function setFriendPrefs(friendName, friendPrefs) {
  const prefs = loadPreferences();
  prefs.friends[friendName] = { ...prefs.friends[friendName], ...friendPrefs };
  savePreferences(prefs);
}

// Utility functions
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

export default {
  loadPreferences,
  savePreferences,
  updatePreference,
  loadHeldMessages,
  saveHeldMessages,
  holdMessage,
  isQuietHours,
  isBatchDeliveryTime,
  shouldDeliverNow,
  getFriendPrefs,
  setFriendPrefs,
  DEFAULT_PREFERENCES
};
