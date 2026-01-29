const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const SERVICE = 'com.clawdbot.stranger-danger';
const ACCOUNT = 'clawdbot';

async function setHash(hash) {
  // Store bcrypt hash in macOS Keychain
  await execFileAsync('security', [
    'add-generic-password',
    '-a',
    ACCOUNT,
    '-s',
    SERVICE,
    '-w',
    hash,
    '-U',
  ]);
}

async function getHash() {
  try {
    const { stdout } = await execFileAsync('security', [
      'find-generic-password',
      '-a',
      ACCOUNT,
      '-s',
      SERVICE,
      '-w',
    ]);
    return stdout.trim();
  } catch (err) {
    if (typeof err?.stderr === 'string' && err.stderr.includes('could not be found')) {
      return null;
    }
    // security returns non-zero when not found; normalize to null
    if (err?.code === 44) {
      return null;
    }
    throw err;
  }
}

async function deleteHash() {
  try {
    await execFileAsync('security', [
      'delete-generic-password',
      '-a',
      ACCOUNT,
      '-s',
      SERVICE,
    ]);
  } catch (err) {
    if (typeof err?.stderr === 'string' && err.stderr.includes('could not be found')) {
      return;
    }
    if (err?.code === 44) {
      return;
    }
    throw err;
  }
}

module.exports = {
  SERVICE,
  ACCOUNT,
  setHash,
  getHash,
  deleteHash,
};
