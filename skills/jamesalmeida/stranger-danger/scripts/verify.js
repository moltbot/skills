const bcrypt = require('bcrypt');
const { getHash } = require('./keychain');

async function verifyAnswer(answer) {
  const storedHash = await getHash();
  if (!storedHash) {
    throw new Error('No stored credentials found. Run setup first.');
  }
  const trimmed = answer.trim();
  if (!trimmed) {
    return false;
  }
  return bcrypt.compare(trimmed, storedHash);
}

module.exports = {
  verifyAnswer,
};
