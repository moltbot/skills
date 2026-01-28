/**
 * LNI loader - loads the native binary
 */
const path = require('path');

let lni;
try {
  lni = require('./lni_js.node');
} catch (e) {
  console.error('❌ LNI binary not found. Run: node scripts/download-binary.js');
  console.error('   Or: cd skills/lightning && npm install');
  throw e;
}

module.exports = lni;
