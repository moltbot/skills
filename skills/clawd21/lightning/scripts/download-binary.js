#!/usr/bin/env node
/**
 * Download prebuilt LNI binary from GitHub releases
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const VERSION = 'v0.2.4';
const REPO = 'lightning-node-interface/lni';
const LIB_DIR = path.join(__dirname, '..', 'lib');

// Map Node.js platform/arch to release asset names
function getPlatformBinary() {
  const platform = process.platform;
  const arch = process.arch;
  
  const mapping = {
    'darwin-arm64': 'darwin-arm64',
    'darwin-x64': 'darwin-x64',
    'linux-x64': 'linux-x64-gnu',
    'linux-arm64': 'linux-arm64-gnu',
    'win32-x64': 'win32-x64-msvc'
  };
  
  const key = `${platform}-${arch}`;
  const binaryName = mapping[key];
  
  if (!binaryName) {
    // Try universal macOS binary as fallback
    if (platform === 'darwin') {
      return 'darwin-universal';
    }
    throw new Error(`Unsupported platform: ${key}`);
  }
  
  return binaryName;
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const follow = (url, redirects = 0) => {
      if (redirects > 5) return reject(new Error('Too many redirects'));
      
      const proto = url.startsWith('https') ? https : require('http');
      proto.get(url, { headers: { 'User-Agent': 'lni-downloader' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return follow(res.headers.location, redirects + 1);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}: ${url}`));
        }
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
        file.on('error', reject);
      }).on('error', reject);
    };
    follow(url);
  });
}

async function main() {
  const binaryName = getPlatformBinary();
  const assetName = `lni_js.${binaryName}.node`;
  const url = `https://github.com/${REPO}/releases/download/${VERSION}/${assetName}`;
  
  console.log(`📦 Downloading LNI ${VERSION} for ${process.platform}-${process.arch}...`);
  console.log(`   ${url}`);
  
  // Create lib directory
  if (!fs.existsSync(LIB_DIR)) {
    fs.mkdirSync(LIB_DIR, { recursive: true });
  }
  
  const destPath = path.join(LIB_DIR, 'lni_js.node');
  
  try {
    await download(url, destPath);
    console.log(`✅ Downloaded to ${destPath}`);
    
    // Verify it's a valid binary
    const stats = fs.statSync(destPath);
    console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  } catch (err) {
    console.error(`❌ Download failed: ${err.message}`);
    process.exit(1);
  }
}

main();
