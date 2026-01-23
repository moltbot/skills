/**
 * ClawdLink Friend Request Protocol
 * 
 * Flow:
 * 1. Alice parses Bob's friend link
 * 2. Alice sends friend_request to Bob via relay (plaintext, signed)
 * 3. Bob receives request, decides to accept/reject
 * 4. If accepted, Bob adds Alice and sends friend_accept (encrypted)
 * 5. Both can now message with shared secret
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import crypto from './crypto.js';
import relay from './relay.js';

const DATA_DIR = join(homedir(), '.clawdbot', 'clawdlink');
const IDENTITY_FILE = join(DATA_DIR, 'identity.json');
const FRIENDS_FILE = join(DATA_DIR, 'friends.json');
const CONFIG_FILE = join(DATA_DIR, 'config.json');
const PENDING_FILE = join(DATA_DIR, 'pending_requests.json');

function loadIdentity() {
  return JSON.parse(readFileSync(IDENTITY_FILE, 'utf8'));
}

function loadConfig() {
  if (!existsSync(CONFIG_FILE)) return { displayName: 'ClawdLink User' };
  return JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
}

function loadFriends() {
  if (!existsSync(FRIENDS_FILE)) return { friends: [] };
  return JSON.parse(readFileSync(FRIENDS_FILE, 'utf8'));
}

function saveFriends(data) {
  writeFileSync(FRIENDS_FILE, JSON.stringify(data, null, 2));
}

function loadPending() {
  if (!existsSync(PENDING_FILE)) return { incoming: [], outgoing: [] };
  return JSON.parse(readFileSync(PENDING_FILE, 'utf8'));
}

function savePending(data) {
  writeFileSync(PENDING_FILE, JSON.stringify(data, null, 2));
}

/**
 * Parse a friend link
 */
export function parseFriendLink(link) {
  const url = new URL(link.replace('clawdlink://', 'https://'));
  const params = new URLSearchParams(url.search);
  
  let key = params.get('key') || '';
  const name = params.get('name') || 'Unknown';
  
  if (key.startsWith('ed25519:')) {
    key = key.slice(8);
  }
  
  if (!key) throw new Error('No public key in link');
  
  return { 
    publicKey: key, 
    displayName: decodeURIComponent(name)
  };
}

/**
 * Send a friend request via the relay
 */
export async function sendFriendRequest(friendLink, message = '') {
  const identity = loadIdentity();
  const config = loadConfig();
  const { publicKey, displayName } = parseFriendLink(friendLink);
  
  // Check if already friends
  const { friends } = loadFriends();
  if (friends.find(f => f.publicKey === publicKey)) {
    throw new Error(`Already friends with ${displayName}`);
  }
  
  // Build signature payload
  const fromHex = relay.base64ToHex(identity.publicKey);
  const toHex = relay.base64ToHex(publicKey);
  const fromX25519Hex = relay.base64ToHex(identity.x25519PublicKey);
  const msg = message || `${config.displayName} wants to connect on ClawdLink`;
  
  const signPayload = `${fromHex}:${toHex}:${config.displayName}:${msg}`;
  const signature = crypto.sign(signPayload, identity.secretKey);
  
  // Send to relay
  const response = await fetch(`${relay.RELAY_URL}/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: fromHex,
      to: toHex,
      fromName: config.displayName,
      fromX25519: fromX25519Hex,
      message: msg,
      signature: relay.base64ToHex(signature)
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send request');
  }
  
  // Save as pending outgoing
  const pending = loadPending();
  pending.outgoing.push({
    to: displayName,
    toKey: publicKey,
    sentAt: new Date().toISOString(),
    status: 'pending'
  });
  savePending(pending);
  
  return { sent: true, to: displayName };
}

/**
 * Fetch friend requests from relay
 */
export async function fetchFriendRequests() {
  const identity = loadIdentity();
  
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = `requests:${timestamp}`;
  const signature = crypto.sign(message, identity.secretKey);
  
  const response = await fetch(`${relay.RELAY_URL}/requests`, {
    method: 'GET',
    headers: {
      'X-ClawdLink-Key': `ed25519:${relay.base64ToHex(identity.publicKey)}`,
      'X-ClawdLink-Timestamp': timestamp,
      'X-ClawdLink-Signature': relay.base64ToHex(signature)
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch requests');
  }
  
  const data = await response.json();
  return data.requests || [];
}

/**
 * Process incoming - check both messages and friend requests
 */
export async function processIncoming() {
  const identity = loadIdentity();
  const { friends } = loadFriends();
  const pending = loadPending();
  
  const results = { requests: [], messages: [], accepted: [] };
  
  // Fetch friend requests
  try {
    const requests = await fetchFriendRequests();
    
    for (const req of requests) {
      // Save to pending if not already there
      if (!pending.incoming.find(p => p.id === req.id)) {
        const incomingReq = {
          id: req.id,
          from: req.fromName,
          fromKey: relay.hexToBase64(req.from),
          fromX25519: relay.hexToBase64(req.fromX25519),
          message: req.message,
          receivedAt: new Date().toISOString()
        };
        pending.incoming.push(incomingReq);
        savePending(pending);
        
        results.requests.push(incomingReq);
      }
    }
  } catch (e) {
    console.error('Error fetching requests:', e.message);
  }
  
  // Fetch messages
  try {
    const messages = await relay.pollMessages(identity);
    
    for (const msg of messages) {
      const friend = friends.find(f => relay.base64ToHex(f.publicKey) === msg.from);
      
      if (friend) {
        try {
          const content = relay.decryptMessage(msg, friend);
          
          if (content.type === 'friend_accept') {
            results.accepted.push({ from: friend.displayName, content });
          } else {
            results.messages.push({
              from: friend.displayName,
              fromKey: friend.publicKey,
              content,
              timestamp: msg.timestamp
            });
          }
        } catch (e) {
          // Decryption failed
        }
      }
    }
  } catch (e) {
    console.error('Error fetching messages:', e.message);
  }
  
  // Also include any pending requests we haven't shown yet
  for (const req of pending.incoming) {
    if (!results.requests.find(r => r.id === req.id)) {
      results.requests.push(req);
    }
  }
  
  return results;
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(requestId) {
  const identity = loadIdentity();
  const config = loadConfig();
  const pending = loadPending();
  const friendsData = loadFriends();
  
  // Find the request
  const request = pending.incoming.find(r => 
    r.id === requestId || 
    r.from?.toLowerCase().includes(requestId.toLowerCase())
  );
  
  if (!request) {
    throw new Error('Friend request not found');
  }
  
  // Derive shared secret
  const sharedSecret = crypto.deriveSharedSecret(
    identity.x25519SecretKey,
    request.fromX25519
  );
  
  // Add as friend
  const newFriend = {
    displayName: request.from,
    publicKey: request.fromKey,
    x25519PublicKey: request.fromX25519,
    sharedSecret: Buffer.from(sharedSecret).toString('base64'),
    addedAt: new Date().toISOString(),
    status: 'connected'
  };
  
  friendsData.friends.push(newFriend);
  saveFriends(friendsData);
  
  // Send acceptance message (encrypted now that we have shared secret)
  const content = {
    type: 'friend_accept',
    from: {
      name: config.displayName,
      publicKey: identity.publicKey,
      x25519PublicKey: identity.x25519PublicKey
    },
    timestamp: new Date().toISOString()
  };
  
  await relay.sendMessage({
    to: request.fromKey,
    content,
    identity,
    friend: newFriend
  });
  
  // Remove from pending
  pending.incoming = pending.incoming.filter(r => r.id !== request.id);
  savePending(pending);
  
  return { accepted: true, friend: request.from };
}

/**
 * Get pending friend requests
 */
export function getPendingRequests() {
  return loadPending();
}

export default {
  parseFriendLink,
  sendFriendRequest,
  fetchFriendRequests,
  processIncoming,
  acceptFriendRequest,
  getPendingRequests
};
