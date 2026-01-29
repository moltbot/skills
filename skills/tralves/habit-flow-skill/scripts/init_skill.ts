#!/usr/bin/env node
/**
 * Skill Initialization Script
 * Runs on skill installation/activation to set up cron jobs
 */

import { execSync } from 'child_process';
import { loadConfig } from '../src/storage.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the skill directory (parent of scripts/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILL_DIR = path.resolve(__dirname, '..');

const SKILL_VERSION = '1.3.0';
const VERSION_FILE = path.join(process.env.HOME || '~', 'clawd', 'habit-flow-data', '.skill-version');

async function getInstalledVersion(): Promise<string | null> {
  try {
    const version = await fs.readFile(VERSION_FILE, 'utf-8');
    return version.trim();
  } catch (error) {
    return null;
  }
}

async function saveInstalledVersion(): Promise<void> {
  await fs.writeFile(VERSION_FILE, SKILL_VERSION, 'utf-8');
}

async function initSkill() {
  console.log('🎯 Initializing HabitFlow skill...\n');

  const installedVersion = await getInstalledVersion();
  const isFirstInstall = !installedVersion;
  const isUpdate = installedVersion && installedVersion !== SKILL_VERSION;

  if (isFirstInstall) {
    console.log('✨ First-time installation detected\n');
  } else if (isUpdate) {
    console.log(`📦 Update detected: v${installedVersion} → v${SKILL_VERSION}\n`);
  } else {
    console.log(`✅ Already on latest version: v${SKILL_VERSION}\n`);
    return;
  }

  try {
    // Load config to ensure data directory exists
    await loadConfig();
    console.log('✅ Data directory initialized\n');

    // Sync proactive coaching cron jobs
    console.log('📅 Setting up proactive coaching cron jobs...');

    try {
      const result = execSync(
        'npx tsx scripts/sync_reminders.ts sync-coaching',
        { cwd: SKILL_DIR, stdio: 'pipe' }
      );
      const output = JSON.parse(result.toString());

      if (output.success) {
        console.log('✅ Proactive coaching cron jobs synced:');
        for (const job of output.results) {
          if (job.success) {
            console.log(`   - ${job.name} (${job.cron})`);
          } else {
            console.log(`   ⚠️  ${job.name} failed: ${job.error}`);
          }
        }
      }
    } catch (error: any) {
      console.log('⚠️  Could not sync cron jobs (you can run manually later)');
      console.log('   Run: npx tsx scripts/sync_reminders.ts sync-coaching');
    }

    console.log('\n📝 Saving version info...');
    await saveInstalledVersion();
    console.log(`✅ Version saved: v${SKILL_VERSION}\n`);

    if (isFirstInstall) {
      console.log('🎉 HabitFlow is ready to use!\n');
      console.log('Quick start:');
      console.log('  1. Chat with your agent: "I want to start meditating daily"');
      console.log('  2. Log completions: "I meditated today"');
      console.log('  3. Check progress: "Show my habits"');
      console.log('\nProactive coaching is active! You\'ll receive:');
      console.log('  - Daily milestone celebrations & risk warnings (8am)');
      console.log('  - Weekly check-ins (Sunday 7pm)');
      console.log('  - Pattern insights (Wednesday 10am)');
    } else if (isUpdate) {
      console.log('🎉 HabitFlow updated successfully!\n');
      console.log('New in v1.3.0:');
      console.log('  - ✅ Proactive coaching automation');
      console.log('  - ✅ Milestone celebrations (7, 14, 21, 30+ days)');
      console.log('  - ✅ Risk warnings before streak breaks');
      console.log('  - ✅ Weekly check-ins with visualizations');
      console.log('  - ✅ Pattern insight detection');
    }

  } catch (error: any) {
    console.error('❌ Initialization failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initSkill().catch(console.error);
}

export { initSkill };
