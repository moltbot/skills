#!/usr/bin/env node
/**
 * Sync Reminders Script
 * Synchronize habit reminder settings to clawdbot cron jobs
 */

import { Command } from 'commander';
import { loadHabits, loadConfig } from '../src/storage.js';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the skill directory (parent of scripts/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILL_DIR = path.resolve(__dirname, '..');

const program = new Command();

program
  .name('sync_reminders')
  .description('Sync habit reminders to clawdbot cron jobs');

program
  .command('sync-reminders')
  .description('Sync habit reminders to cron jobs')
  .option('--sync-all', 'Sync all habit reminders')
  .option('--habit-id <id>', 'Sync specific habit')
  .option('--add', 'Add reminder for habit')
  .option('--remove', 'Remove reminder for habit')
  .option('--update', 'Update reminder for habit')
  .action(async (options) => {
    try {
      const data = await loadHabits();
      const config = await loadConfig();

      let habits = data.habits;

      if (options.habitId) {
        const habit = habits.find(h => h.id === options.habitId);
        if (!habit) {
          throw new Error(`Habit with id ${options.habitId} not found`);
        }
        habits = [habit];
      }

      const results = [];

      for (const habit of habits) {
        if (!habit.reminderSettings?.enabled && !options.remove) {
          continue;
        }

        const cronName = `HabitFlow: ${habit.name}`;

        if (options.remove) {
          // Remove cron job
          try {
            execSync(`clawdbot cron remove --name "${cronName}"`, { stdio: 'pipe' });
            results.push({
              habitId: habit.id,
              habitName: habit.name,
              action: 'removed',
              success: true
            });
          } catch (error) {
            results.push({
              habitId: habit.id,
              habitName: habit.name,
              action: 'removed',
              success: false,
              error: 'Cron job not found or already removed'
            });
          }
          continue;
        }

        if (options.update) {
          // Remove old cron job first
          try {
            execSync(`clawdbot cron remove --name "${cronName}"`, { stdio: 'pipe' });
          } catch (error) {
            // Ignore error if cron job doesn't exist
          }
        }

        // Add/update cron job for each reminder time
        if (habit.reminderSettings?.times && habit.reminderSettings.times.length > 0) {
          for (const time of habit.reminderSettings.times) {
            const [hour, minute] = time.split(':');
            const cronExpression = `${minute} ${hour} * * *`;

            const message = habit.reminderSettings.message ||
              `🎯 Reminder: Time for your ${habit.name}\n\nTarget: ${habit.targetCount} ${habit.targetUnit || 'session'}\nCurrent streak: ${habit.currentStreak} days 🔥\n\nQuick log: Reply 'done', 'skipped', or 'missed'`;

            try {
              // Determine delivery method (priority: habit settings > config > default)
              const deliveryChannel = habit.reminderSettings.channel || 'last';
              const deliveryTo = habit.reminderSettings.to || config.phoneNumber;

              // Build cron command
              const cronParts = [
                'clawdbot cron add',
                `--name "${cronName}"`,
                `--cron "${cronExpression}"`,
                `--tz "${config.timezone}"`,
                '--session isolated',
                `--message "${message.replace(/"/g, '\\"')}"`,
                '--deliver'
              ];

              // Add delivery target
              if (deliveryTo) {
                cronParts.push(`--to "${deliveryTo}"`);
              } else {
                cronParts.push(`--channel ${deliveryChannel}`);
              }

              const cronCommand = cronParts.join(' ');

              execSync(cronCommand, { stdio: 'pipe' });

              results.push({
                habitId: habit.id,
                habitName: habit.name,
                action: options.update ? 'updated' : 'added',
                time,
                cronExpression,
                success: true
              });
            } catch (error: any) {
              results.push({
                habitId: habit.id,
                habitName: habit.name,
                action: options.update ? 'updated' : 'added',
                time,
                success: false,
                error: error.message
              });
            }
          }
        }
      }

      console.log(JSON.stringify({
        success: true,
        results
      }, null, 2));
    } catch (error: any) {
      console.error(JSON.stringify({
        success: false,
        error: error.message
      }, null, 2));
      process.exit(1);
    }
  });

program
  .command('sync-coaching')
  .description('Sync proactive coaching cron jobs')
  .option('--remove', 'Remove coaching cron jobs')
  .action(async (options) => {
    try {
      const config = await loadConfig();
      const results = [];

      const coachingJobs = [
        {
          name: 'HabitFlow: Daily Coaching Check',
          cron: '0 8 * * *',
          description: 'Daily milestone and risk checks',
          message: `Execute the HabitFlow proactive coaching check and deliver messages with visualizations.

IMPORTANT: This is an automated coaching message. Run this command and display the results with any images:

cd "${SKILL_DIR}" && npx tsx scripts/proactive_coaching.ts --check-milestones --check-risks --format json

Parse the JSON output. For each message:
1. Display the subject and body text
2. If attachments exist, use the Read tool to display each image file
3. Format as a complete coaching message with visualizations

Send the complete message to the user.`
        },
        {
          name: 'HabitFlow: Weekly Check-in',
          cron: '0 19 * * 0',
          description: 'Weekly progress check-in (Sunday 7pm)',
          message: `Execute the HabitFlow weekly check-in and deliver with visualizations.

IMPORTANT: This is an automated coaching message. Run this command and display the results with images:

cd "${SKILL_DIR}" && npx tsx scripts/proactive_coaching.ts --weekly-checkin --format json

Parse the JSON output. For each message:
1. Display the subject and body text
2. If attachments exist, use the Read tool to display each image file (trends chart + heatmap)
3. Format as a complete coaching message with visualizations

Send the complete message to the user.`
        },
        {
          name: 'HabitFlow: Pattern Insights',
          cron: '0 10 * * 3',
          description: 'Mid-week pattern insights (Wednesday 10am)',
          message: `Execute the HabitFlow pattern insights analysis and deliver with visualizations.

IMPORTANT: This is an automated coaching message. Run this command and display the results with images:

cd "${SKILL_DIR}" && npx tsx scripts/proactive_coaching.ts --detect-insights --format json

Parse the JSON output. For each message:
1. Display the subject and body text
2. If attachments exist, use the Read tool to display each image file
3. Format as a complete coaching message with visualizations

Send the complete message to the user.`
        }
      ];

      for (const job of coachingJobs) {
        if (options.remove) {
          // Remove cron job
          try {
            execSync(`clawdbot cron remove --name "${job.name}"`, { stdio: 'pipe' });
            results.push({
              name: job.name,
              action: 'removed',
              success: true
            });
          } catch (error) {
            results.push({
              name: job.name,
              action: 'removed',
              success: false,
              error: 'Cron job not found or already removed'
            });
          }
        } else {
          // Remove old job first (update)
          try {
            execSync(`clawdbot cron remove --name "${job.name}"`, { stdio: 'pipe' });
          } catch (error) {
            // Ignore error if doesn't exist
          }

          // Add cron job using --message + --deliver approach
          // This allows the agent to use tools (like sendAttachment for images)
          try {
            const cronCommand = [
              'clawdbot cron add',
              `--name "${job.name}"`,
              `--cron "${job.cron}"`,
              `--tz "${config.timezone}"`,
              '--session isolated',
              `--message "${job.message}"`,
              '--deliver',
              '--channel last'
            ].join(' ');

            execSync(cronCommand, { stdio: 'pipe' });

            results.push({
              name: job.name,
              action: 'added',
              cron: job.cron,
              description: job.description,
              success: true
            });
          } catch (error: any) {
            results.push({
              name: job.name,
              action: 'added',
              success: false,
              error: error.message
            });
          }
        }
      }

      console.log(JSON.stringify({
        success: true,
        results
      }, null, 2));
    } catch (error: any) {
      console.error(JSON.stringify({
        success: false,
        error: error.message
      }, null, 2));
      process.exit(1);
    }
  });

program.parse();
