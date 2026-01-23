/**
 * ClawdLink Relay Client
 * Sends and receives messages via the central relay
 */

import crypto from './crypto.js';
import nacl from 'tweetnacl';
import util from 'tweetnacl-util';

const { decodeBase64 } = util;

const RELAY_URL = 'https://clawdlink-relay.vercel.app';

/**
 * Convert base64 to hex
 */
export function base64ToHex(b64) {
  const bytes = decodeBase64(b64);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Convert hex to base64
 */
export function hexToBase64(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return util.encodeBase64(bytes);
}

/**
 * Send an encrypted message via the relay
 * 
 * @param {Object} params
 * @param {string} params.to - Recipient's public key (base64)
 * @param {Object} params.content - Message content to encrypt
 * @param {Object} params.identity - Sender's identity
 * @param {Object} params.friend - Friend object with shared secret (base64)
 */
export async function sendMessage({ to, content, identity, friend }) {
  // Decode shared secret from base64 to Uint8Array
  const sharedSecretBytes = decodeBase64(friend.sharedSecret);
  
  // Encrypt the message with shared secret
  const { ciphertext, nonce } = crypto.encrypt(content, sharedSecretBytes);
  
  // Sign the ciphertext with our Ed25519 key
  const signature = crypto.sign(ciphertext, identity.secretKey);
  
  // Send to relay (convert to hex for relay API)
  const response = await fetch(`${RELAY_URL}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `ed25519:${base64ToHex(identity.publicKey)}`,
      to: `ed25519:${base64ToHex(to)}`,
      ciphertext,
      nonce,
      signature: base64ToHex(signature)
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send message');
  }

  return response.json();
}

/**
 * Poll for messages from the relay
 * 
 * @param {Object} identity - Our identity
 * @returns {Promise<Array>} Array of encrypted messages
 */
export async function pollMessages(identity) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = `poll:${timestamp}`;
  const signature = crypto.sign(message, identity.secretKey);
  
  const response = await fetch(`${RELAY_URL}/poll`, {
    method: 'GET',
    headers: {
      'X-ClawdLink-Key': `ed25519:${base64ToHex(identity.publicKey)}`,
      'X-ClawdLink-Timestamp': timestamp,
      'X-ClawdLink-Signature': base64ToHex(signature)
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to poll messages');
  }

  const data = await response.json();
  return data.messages || [];
}

/**
 * Decrypt a message from the relay
 * 
 * @param {Object} encryptedMsg - Encrypted message from relay
 * @param {Object} friend - Friend object with shared secret (base64)
 */
export function decryptMessage(encryptedMsg, friend) {
  try {
    const sharedSecretBytes = decodeBase64(friend.sharedSecret);
    return crypto.decrypt(
      encryptedMsg.ciphertext,
      encryptedMsg.nonce,
      sharedSecretBytes
    );
  } catch (err) {
    throw new Error('Failed to decrypt message');
  }
}

/**
 * Check relay health
 */
export async function checkHealth() {
  const response = await fetch(`${RELAY_URL}/health`);
  return response.json();
}

export default {
  sendMessage,
  pollMessages,
  decryptMessage,
  checkHealth,
  base64ToHex,
  hexToBase64,
  RELAY_URL
};
