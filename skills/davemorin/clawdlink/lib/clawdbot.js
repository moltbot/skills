/**
 * ClawdLink Clawdbot Integration
 * 
 * Functions for integrating ClawdLink with Clawdbot:
 * - Poll and format messages for chat delivery
 * - Handle friend requests in conversation
 * - Send messages from natural language
 */

import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import relay from './relay.js';
import requests from './requests.js';

const DATA_DIR = join(homedir(), '.clawdbot', 'clawdlink');
const IDENTITY_FILE = join(DATA_DIR, 'identity.json');
const FRIENDS_FILE = join(DATA_DIR, 'friends.json');
const CONFIG_FILE = join(DATA_DIR, 'config.json');

function isSetup() {
  return existsSync(IDENTITY_FILE);
}

function loadIdentity() {
  return JSON.parse(readFileSync(IDENTITY_FILE, 'utf8'));
}

function loadFriends() {
  if (!existsSync(FRIENDS_FILE)) return { friends: [] };
  return JSON.parse(readFileSync(FRIENDS_FILE, 'utf8'));
}

function loadConfig() {
  if (!existsSync(CONFIG_FILE)) return { displayName: 'ClawdLink User' };
  return JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
}

/**
 * Check for new messages and friend requests
 * Returns formatted output for Clawdbot to relay to user
 */
export async function checkMessages() {
  if (!isSetup()) {
    return { 
      setup: false, 
      message: 'ClawdLink is not set up. Run: clawdlink setup "Your Name"' 
    };
  }

  try {
    const result = await requests.processIncoming();
    const output = { setup: true, messages: [], requests: [], accepted: [] };

    // Format friend requests
    for (const req of result.requests) {
      output.requests.push({
        id: req.id,
        from: req.from,
        message: req.message,
        formatted: `🔗 **Friend request from ${req.from}**\n"${req.message}"\n\nSay "accept friend request from ${req.from}" to connect.`
      });
    }

    // Format accepted requests
    for (const acc of result.accepted) {
      output.accepted.push({
        from: acc.from,
        formatted: `✓ **${acc.from}** accepted your friend request! You can now message them.`
      });
    }

    // Format messages
    for (const msg of result.messages) {
      const text = msg.content.text || JSON.stringify(msg.content);
      output.messages.push({
        from: msg.from,
        text,
        timestamp: msg.timestamp,
        formatted: `📨 **Message from ${msg.from}:**\n"${text}"`
      });
    }

    return output;
  } catch (err) {
    return { setup: true, error: err.message };
  }
}

/**
 * Send a message to a friend
 * 
 * @param {string} friendName - Friend's name
 * @param {string} messageText - Message text
 * @param {Object} options - Optional metadata
 * @param {string} options.urgency - 'normal' | 'urgent' | 'fyi'
 * @param {string} options.context - 'work' | 'personal' | 'social'
 * @param {string} options.respondBy - ISO timestamp for response deadline
 */
export async function sendToFriend(friendName, messageText, options = {}) {
  if (!isSetup()) {
    return { success: false, error: 'ClawdLink not set up' };
  }

  const identity = loadIdentity();
  const config = loadConfig();
  const { friends } = loadFriends();

  // Find friend
  const query = friendName.toLowerCase();
  const friend = friends.find(f => 
    f.displayName?.toLowerCase().includes(query)
  );

  if (!friend) {
    const available = friends.map(f => f.displayName).join(', ');
    return { 
      success: false, 
      error: `Friend "${friendName}" not found.`,
      available: available || 'No friends yet'
    };
  }

  if (friend.status !== 'connected') {
    return { success: false, error: `${friend.displayName} hasn't accepted your request yet.` };
  }

  const content = {
    type: 'message',
    text: messageText,
    timestamp: new Date().toISOString(),
    from: {
      name: config.displayName,
      key: identity.publicKey
    },
    // Delivery metadata
    urgency: options.urgency || 'normal',
    context: options.context || 'personal',
    respondBy: options.respondBy || null
  };

  try {
    const result = await relay.sendMessage({
      to: friend.publicKey,
      content,
      identity,
      friend
    });

    return {
      success: true,
      to: friend.displayName,
      messageId: result.id,
      formatted: `✓ Message sent to ${friend.displayName}`
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Add a friend from a link
 */
export async function addFriend(friendLink, message = '') {
  if (!isSetup()) {
    return { success: false, error: 'ClawdLink not set up' };
  }

  try {
    const result = await requests.sendFriendRequest(friendLink, message);
    return {
      success: true,
      to: result.to,
      formatted: `✓ Friend request sent to ${result.to}. They'll receive it when they check ClawdLink.`
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Accept a friend request
 */
export async function acceptFriend(nameOrId) {
  if (!isSetup()) {
    return { success: false, error: 'ClawdLink not set up' };
  }

  const pending = requests.getPendingRequests();
  
  // Find by name or ID
  const query = nameOrId.toLowerCase();
  const request = pending.incoming.find(r => 
    r.from?.toLowerCase().includes(query) || 
    r.id?.toLowerCase().includes(query)
  );

  if (!request) {
    return { 
      success: false, 
      error: `No pending request from "${nameOrId}"`,
      pending: pending.incoming.map(r => r.from)
    };
  }

  try {
    const result = await requests.acceptFriendRequest(request.id);
    return {
      success: true,
      friend: result.friend,
      formatted: `✓ You're now connected with ${result.friend}! You can message them anytime.`
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Get friend link
 */
export function getFriendLink() {
  if (!isSetup()) {
    return { success: false, error: 'ClawdLink not set up' };
  }

  const identity = loadIdentity();
  const config = loadConfig();

  const params = new URLSearchParams({
    key: `ed25519:${identity.publicKey}`,
    name: config.displayName
  });

  return {
    success: true,
    link: `clawdlink://relay.clawdlink.bot/add?${params.toString()}`,
    name: config.displayName
  };
}

/**
 * List friends
 */
export function listFriends() {
  if (!isSetup()) {
    return { success: false, error: 'ClawdLink not set up' };
  }

  const { friends } = loadFriends();
  return {
    success: true,
    friends: friends.map(f => ({
      name: f.displayName,
      status: f.status,
      addedAt: f.addedAt
    })),
    count: friends.length
  };
}

/**
 * Get status
 */
export async function getStatus() {
  const setup = isSetup();
  
  if (!setup) {
    return { setup: false };
  }

  const config = loadConfig();
  const { friends } = loadFriends();
  const pending = requests.getPendingRequests();

  let relayStatus = 'unknown';
  try {
    const health = await relay.checkHealth();
    relayStatus = health.status === 'ok' ? 'online' : 'error';
  } catch {
    relayStatus = 'offline';
  }

  return {
    setup: true,
    name: config.displayName,
    friends: friends.length,
    pendingIncoming: pending.incoming.length,
    pendingOutgoing: pending.outgoing.length,
    relay: relayStatus
  };
}

export default {
  checkMessages,
  sendToFriend,
  addFriend,
  acceptFriend,
  getFriendLink,
  listFriends,
  getStatus
};
