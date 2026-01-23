/**
 * ClawdLink Crypto Library
 * Ed25519 for identity/signing, X25519 for key exchange, XChaCha20-Poly1305 for messages
 */

import nacl from 'tweetnacl';
import util from 'tweetnacl-util';

const { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } = util;

/**
 * Generate a new Ed25519 keypair for identity
 */
export function generateIdentity() {
  const keyPair = nacl.sign.keyPair();
  return {
    publicKey: encodeBase64(keyPair.publicKey),
    secretKey: encodeBase64(keyPair.secretKey)
  };
}

/**
 * Derive X25519 key from Ed25519 key for encryption
 * Ed25519 signing keys can be converted to X25519 encryption keys
 */
export function ed25519ToX25519(ed25519SecretKey) {
  const secretKeyBytes = decodeBase64(ed25519SecretKey);
  // Use first 32 bytes of Ed25519 secret key as X25519 secret key
  const x25519SecretKey = secretKeyBytes.slice(0, 32);
  const x25519PublicKey = nacl.scalarMult.base(x25519SecretKey);
  return {
    publicKey: encodeBase64(x25519PublicKey),
    secretKey: encodeBase64(x25519SecretKey)
  };
}

/**
 * Derive shared secret from our secret key and their public key
 */
export function deriveSharedSecret(ourSecretKey, theirPublicKey) {
  const ourSecret = decodeBase64(ourSecretKey);
  const theirPublic = decodeBase64(theirPublicKey);
  const shared = nacl.scalarMult(ourSecret.slice(0, 32), theirPublic);
  // Hash the shared secret to get encryption key
  return nacl.hash(shared).slice(0, 32);
}

/**
 * Encrypt a message with a shared secret
 */
export function encrypt(message, sharedSecret) {
  const nonce = nacl.randomBytes(24);
  const messageBytes = decodeUTF8(JSON.stringify(message));
  const encrypted = nacl.secretbox(messageBytes, nonce, sharedSecret);
  return {
    nonce: encodeBase64(nonce),
    ciphertext: encodeBase64(encrypted)
  };
}

/**
 * Decrypt a message with a shared secret
 */
export function decrypt(ciphertext, nonce, sharedSecret) {
  const ciphertextBytes = decodeBase64(ciphertext);
  const nonceBytes = decodeBase64(nonce);
  const decrypted = nacl.secretbox.open(ciphertextBytes, nonceBytes, sharedSecret);
  if (!decrypted) {
    throw new Error('Decryption failed');
  }
  return JSON.parse(encodeUTF8(decrypted));
}

/**
 * Sign a message with Ed25519 secret key
 */
export function sign(message, secretKey) {
  const messageBytes = decodeUTF8(typeof message === 'string' ? message : JSON.stringify(message));
  const secretKeyBytes = decodeBase64(secretKey);
  const signature = nacl.sign.detached(messageBytes, secretKeyBytes);
  return encodeBase64(signature);
}

/**
 * Verify a signature with Ed25519 public key
 */
export function verify(message, signature, publicKey) {
  const messageBytes = decodeUTF8(typeof message === 'string' ? message : JSON.stringify(message));
  const signatureBytes = decodeBase64(signature);
  const publicKeyBytes = decodeBase64(publicKey);
  return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
}

/**
 * Generate a random ID
 */
export function randomId() {
  return encodeBase64(nacl.randomBytes(16)).replace(/[/+=]/g, '').slice(0, 16);
}

export default {
  generateIdentity,
  ed25519ToX25519,
  deriveSharedSecret,
  encrypt,
  decrypt,
  sign,
  verify,
  randomId
};
