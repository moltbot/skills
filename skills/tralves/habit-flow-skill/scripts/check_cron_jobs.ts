#!/usr/bin/env node
/**
 * Check and Sync Cron Jobs
 * Verifies proactive coaching cron jobs exist and recreates if needed
 */

import { Command } from 'commander';
import { execSync } from 'child_process';
import { loadConfig } from '../src/storage.js';

const program = new Command();

interface CronJob {
  name: string;
  cron: string;
  description: string;
}

const EXPECTED_JOBS: CronJob[] = [
  {
    name: 'HabitFlow: Daily Coaching Check',
    cron: '0 8 * * *',
    description: 'Daily milestone and risk checks (8am)'
  },
  {
    name: 'HabitFlow: Weekly Check-in',
    cron: '0 19 * * 0',
    description: 'Weekly progress check-in (Sunday 7pm)'
  },
  {
    name: 'HabitFlow: Pattern Insights',
    cron: '0 10 * * 3',
    description: 'Mid-week pattern insights (Wednesday 10am)'
  }
];

program
  .name('check_cron_jobs')
  .description('Check and sync proactive coaching cron jobs')
  .option('--auto-fix', 'Automatically recreate missing cron jobs')
  .option('--verbose', 'Show detailed output')
  .action(async (options) => {
    try {
      console.log('🔍 Checking proactive coaching cron jobs...\n');

      // Get list of existing cron jobs
      let existingJobs: string[] = [];
      try {
        const result = execSync('clawdbot cron list', { stdio: 'pipe', encoding: 'utf-8' });
        // Parse text output to extract job names
        const lines = result.split('\n');
        existingJobs = lines
          .filter(line => line.includes('HabitFlow:'))
          .map(line => {
            // Extract name from lines like "- HabitFlow: Daily Coaching Check (0 8 * * *)"
            const match = line.match(/HabitFlow:[^(]+/);
            return match ? match[0].trim() : '';
          })
          .filter(name => name);
      } catch (error) {
        console.log('⚠️  Could not fetch cron job list (clawdbot may not be available)');
        if (options.verbose) {
          console.log(`   Error: ${error}`);
        }
        existingJobs = [];
      }

      const results = {
        total: EXPECTED_JOBS.length,
        existing: 0,
        missing: [] as string[],
        fixed: [] as string[]
      };

      // Check each expected job
      for (const job of EXPECTED_JOBS) {
        const exists = existingJobs.includes(job.name);

        if (exists) {
          results.existing++;
          console.log(`✅ ${job.name}`);
          if (options.verbose) {
            console.log(`   Schedule: ${job.cron}`);
            console.log(`   ${job.description}`);
          }
        } else {
          results.missing.push(job.name);
          console.log(`❌ ${job.name} - MISSING`);
          if (options.verbose) {
            console.log(`   Expected schedule: ${job.cron}`);
            console.log(`   ${job.description}`);
          }
        }
      }

      console.log(`\n📊 Summary: ${results.existing}/${results.total} cron jobs found`);

      // Auto-fix if requested
      if (results.missing.length > 0) {
        if (options.autoFix) {
          console.log('\n🔧 Auto-fixing missing cron jobs...');

          try {
            const syncResult = execSync(
              'npx tsx scripts/sync_reminders.ts sync-coaching',
              { stdio: 'pipe' }
            );
            const output = JSON.parse(syncResult.toString());

            if (output.success) {
              for (const result of output.results) {
                if (result.success) {
                  results.fixed.push(result.name);
                  console.log(`✅ Created: ${result.name}`);
                }
              }
            }

            console.log(`\n✅ Fixed ${results.fixed.length} cron jobs`);
          } catch (error: any) {
            console.error('❌ Failed to sync cron jobs:', error.message);
            process.exit(1);
          }
        } else {
          console.log('\n💡 To fix missing cron jobs, run:');
          console.log('   npx tsx scripts/sync_reminders.ts sync-coaching');
          console.log('\n   Or run this script with --auto-fix flag:');
          console.log('   npx tsx scripts/check_cron_jobs.ts --auto-fix');
        }
      } else {
        console.log('\n✅ All proactive coaching cron jobs are configured correctly!');
      }

      // Exit with error code if jobs are missing and not auto-fixed
      if (results.missing.length > 0 && !options.autoFix) {
        process.exit(1);
      }

    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  });

program.parse();
