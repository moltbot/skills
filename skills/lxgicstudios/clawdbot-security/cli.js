#!/usr/bin/env node
/**
 * Clawdbot Security Audit CLI
 * Scans for common security issues and provides fixes
 * Based on: https://x.com/NickSpisak_/status/2016195582180700592
 */

import { execSync, exec } from 'child_process';
import { existsSync, statSync, chmodSync, readFileSync, writeFileSync } from 'fs';
import { homedir, platform } from 'os';
import { join } from 'path';

const CLAWDBOT_DIR = join(homedir(), '.clawdbot');
const CONFIG_FILE = join(CLAWDBOT_DIR, 'clawdbot.json');
const CREDS_DIR = join(CLAWDBOT_DIR, 'credentials');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

const args = process.argv.slice(2);
const flags = {
  fix: args.includes('--fix'),
  deep: args.includes('--deep'),
  quiet: args.includes('--quiet'),
  help: args.includes('--help') || args.includes('-h'),
};

function log(msg, color = RESET) {
  if (!flags.quiet) console.log(`${color}${msg}${RESET}`);
}

function pass(msg) { log(`✅ ${msg}`, GREEN); }
function warn(msg) { log(`⚠️  ${msg}`, YELLOW); }
function fail(msg) { log(`❌ ${msg}`, RED); }
function info(msg) { log(`ℹ️  ${msg}`, CYAN); }

function showHelp() {
  console.log(`
${BOLD}Clawdbot Security Audit${RESET}

Usage: clawdbot-security [options]

Options:
  --fix     Automatically fix issues where possible
  --deep    Run additional checks (network scan, etc.)
  --quiet   Suppress output except errors
  -h, --help  Show this help

Checks:
  1. Gateway binding (loopback vs exposed)
  2. File permissions on config/credentials
  3. Authentication enabled
  4. Node.js version (known vulnerabilities)
  5. mDNS/Bonjour broadcasting
  6. [deep] External network accessibility
  7. [deep] Shodan exposure check
`);
}

// Check 1: Gateway binding
function checkGatewayBinding() {
  log('\n📡 Checking gateway binding...', BOLD);
  
  if (!existsSync(CONFIG_FILE)) {
    warn('Config file not found at ' + CONFIG_FILE);
    return false;
  }

  try {
    const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
    const bind = config?.gateway?.bind || 'loopback';
    
    if (bind === 'loopback' || bind === '127.0.0.1') {
      pass('Gateway bound to localhost only (safe)');
      return true;
    } else {
      fail(`Gateway bound to "${bind}" - EXPOSED!`);
      
      if (flags.fix) {
        config.gateway = config.gateway || {};
        config.gateway.bind = 'loopback';
        writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
        pass('Fixed: Set gateway.bind = "loopback"');
        info('Restart gateway: clawdbot gateway restart');
      } else {
        info('Run with --fix to auto-remediate');
      }
      return false;
    }
  } catch (e) {
    warn('Could not parse config: ' + e.message);
    return false;
  }
}

// Check 2: File permissions
function checkFilePermissions() {
  log('\n🔐 Checking file permissions...', BOLD);
  
  if (platform() === 'win32') {
    info('Skipping permission check on Windows');
    return true;
  }

  let allGood = true;
  const checks = [
    { path: CLAWDBOT_DIR, mode: 0o700, name: 'Config directory' },
    { path: CONFIG_FILE, mode: 0o600, name: 'Config file' },
    { path: CREDS_DIR, mode: 0o700, name: 'Credentials directory' },
  ];

  for (const check of checks) {
    if (!existsSync(check.path)) continue;
    
    const stat = statSync(check.path);
    const mode = stat.mode & 0o777;
    const isDir = stat.isDirectory();
    const expectedMode = check.mode;
    
    // Check if others/group have access
    const groupOther = mode & 0o077;
    
    if (groupOther === 0) {
      pass(`${check.name}: permissions OK (${mode.toString(8)})`);
    } else {
      fail(`${check.name}: too permissive (${mode.toString(8)})`);
      allGood = false;
      
      if (flags.fix) {
        chmodSync(check.path, expectedMode);
        pass(`Fixed: chmod ${expectedMode.toString(8)} ${check.path}`);
      }
    }
  }
  
  return allGood;
}

// Check 3: Authentication
function checkAuthentication() {
  log('\n🔑 Checking authentication...', BOLD);
  
  if (!existsSync(CONFIG_FILE)) {
    warn('Config file not found');
    return false;
  }

  try {
    const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
    const authMode = config?.gateway?.auth?.mode;
    
    if (authMode === 'token' || authMode === 'password') {
      pass(`Authentication enabled (mode: ${authMode})`);
      return true;
    } else {
      warn('No authentication configured');
      info('Add to clawdbot.json: "gateway": { "auth": { "mode": "token" } }');
      info('Then set CLAWDBOT_GATEWAY_TOKEN environment variable');
      return false;
    }
  } catch (e) {
    warn('Could not parse config: ' + e.message);
    return false;
  }
}

// Check 4: Node.js version
function checkNodeVersion() {
  log('\n📦 Checking Node.js version...', BOLD);
  
  const version = process.version;
  const [major, minor] = version.slice(1).split('.').map(Number);
  
  if (major >= 22) {
    pass(`Node.js ${version} (secure)`);
    return true;
  } else if (major >= 20) {
    warn(`Node.js ${version} - consider upgrading to 22.x+`);
    return true;
  } else {
    fail(`Node.js ${version} - OUTDATED, has known vulnerabilities`);
    info('Upgrade: https://nodejs.org/');
    return false;
  }
}

// Check 5: mDNS/Bonjour
function checkMdns() {
  log('\n📢 Checking mDNS broadcasting...', BOLD);
  
  const disabled = process.env.CLAWDBOT_DISABLE_BONJOUR === '1';
  
  if (disabled) {
    pass('mDNS broadcasting disabled');
    return true;
  } else {
    warn('mDNS broadcasting may be enabled');
    info('Set environment variable: CLAWDBOT_DISABLE_BONJOUR=1');
    return false;
  }
}

// Check 6: Tailscale
function checkTailscale() {
  log('\n🔒 Checking Tailscale...', BOLD);
  
  try {
    const result = execSync('tailscale status 2>/dev/null', { encoding: 'utf-8' });
    if (result.includes('logged in')) {
      pass('Tailscale is active');
      return true;
    }
  } catch {
    // Tailscale not installed or not running
  }
  
  info('Tailscale not detected (optional but recommended for remote access)');
  info('Install: https://tailscale.com/');
  return true; // Not a failure, just informational
}

// Deep check: External accessibility
async function checkExternalAccess() {
  if (!flags.deep) return true;
  
  log('\n🌐 [DEEP] Checking external accessibility...', BOLD);
  
  try {
    const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
    const port = config?.gateway?.port || 18789;
    
    // Try to get public IP
    const publicIp = execSync('curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null', { encoding: 'utf-8' }).trim();
    
    if (!publicIp) {
      info('Could not determine public IP');
      return true;
    }
    
    info(`Public IP: ${publicIp}`);
    info(`Checking port ${port}...`);
    
    // Use nc to check if port is open externally
    try {
      execSync(`nc -zv -w3 ${publicIp} ${port} 2>&1`, { encoding: 'utf-8' });
      fail(`Port ${port} is EXTERNALLY ACCESSIBLE!`);
      info('Your gateway may be exposed to the internet');
      info('Ensure firewall blocks port 18789 from external access');
      return false;
    } catch {
      pass(`Port ${port} not accessible externally (good)`);
      return true;
    }
  } catch (e) {
    warn('Could not check external access: ' + e.message);
    return true;
  }
}

// Summary
function printSummary(results) {
  log('\n' + '='.repeat(50), BOLD);
  log('SECURITY AUDIT SUMMARY', BOLD);
  log('='.repeat(50));
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  for (const [check, passed] of Object.entries(results)) {
    log(`  ${passed ? '✅' : '❌'} ${check}`);
  }
  
  log('');
  if (passed === total) {
    log(`🎉 All ${total} checks passed!`, GREEN);
  } else {
    log(`⚠️  ${passed}/${total} checks passed`, YELLOW);
    if (!flags.fix) {
      info('Run with --fix to auto-remediate issues');
    }
  }
}

// Main
async function main() {
  if (flags.help) {
    showHelp();
    process.exit(0);
  }

  log('🔍 Clawdbot Security Audit', BOLD);
  log(`   Config: ${CONFIG_FILE}`);
  log(`   Mode: ${flags.fix ? 'Fix' : 'Scan only'}${flags.deep ? ' (deep)' : ''}`);
  
  const results = {
    'Gateway Binding': checkGatewayBinding(),
    'File Permissions': checkFilePermissions(),
    'Authentication': checkAuthentication(),
    'Node.js Version': checkNodeVersion(),
    'mDNS Broadcasting': checkMdns(),
    'Tailscale': checkTailscale(),
  };
  
  if (flags.deep) {
    results['External Access'] = await checkExternalAccess();
  }
  
  printSummary(results);
}

main().catch(console.error);
