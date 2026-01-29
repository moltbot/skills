const fs = require('fs');
const os = require('os');
const path = require('path');

const CONFIG_DIR = path.join(os.homedir(), '.clawdbot');
const CONFIG_PATH = path.join(CONFIG_DIR, 'stranger-danger.json');

function ensureDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }
}

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    return null;
  }
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  return JSON.parse(raw);
}

function saveConfig(config) {
  ensureDir();
  const data = JSON.stringify(config, null, 2);
  fs.writeFileSync(CONFIG_PATH, data, { mode: 0o600 });
}

function clearConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    fs.rmSync(CONFIG_PATH);
  }
}

module.exports = {
  CONFIG_PATH,
  loadConfig,
  saveConfig,
  clearConfig,
};
