#!/usr/bin/env node
/**
 * Log Habit Script
 * Record habit completions with automatic streak recalculation
 */

import { Command } from 'commander';
import {
  loadHabits,
  loadLogs,
  appendLog,
  updateLog,
  updateHabit,
  generateId,
  loadConfig
} from '../src/storage.js';
import { HabitLogStatus } from '../src/types.js';
import { calculateStreak } from '../src/streak-calculation.js';

const program = new Command();

program
  .name('log_habit')
  .description('Record habit completions')
  .requiredOption('--habit-id <id>', 'Habit ID')
  .option('--date <date>', 'Log date (ISO format, default: today)')
  .option('--dates <dates>', 'Multiple dates comma-separated (for bulk logging)')
  .requiredOption('--status <status>', 'Log status (completed, partial, missed, skipped)')
  .option('--count <count>', 'Actual count', parseInt)
  .option('--notes <notes>', 'Additional notes')
  .option('--metadata <json>', 'Additional metadata as JSON string')
  .action(async (options) => {
    try {
      const config = await loadConfig();
      const data = await loadHabits();

      // Find the habit
      const habit = data.habits.find(h => h.id === options.habitId);
      if (!habit) {
        throw new Error(`Habit with id ${options.habitId} not found`);
      }

      // Parse dates
      let dates: string[] = [];
      if (options.dates) {
        dates = options.dates.split(',').map((d: string) => d.trim());
      } else if (options.date) {
        dates = [options.date];
      } else {
        dates = [new Date().toISOString().split('T')[0]];
      }

      // Validate status
      const status = options.status.toLowerCase() as HabitLogStatus;
      if (!Object.values(HabitLogStatus).includes(status)) {
        throw new Error(`Invalid status: ${options.status}`);
      }

      const actualCount = options.count ?? habit.targetCount;
      const metadata = options.metadata ? JSON.parse(options.metadata) : undefined;

      let logsCreated = 0;
      let logsUpdated = 0;

      // Load existing logs for this habit
      const year = new Date(dates[0]).getFullYear();
      const existingLogs = await loadLogs(options.habitId, year);

      for (const dateStr of dates) {
        const logDate = new Date(dateStr);
        const dateKey = logDate.toISOString().split('T')[0];

        // Check if log already exists for this date
        const existingLog = existingLogs.find(l => {
          const existingDate = new Date(l.logDate).toISOString().split('T')[0];
          return existingDate === dateKey;
        });

        if (existingLog) {
          // Update existing log
          await updateLog(options.habitId, existingLog.id, {
            status,
            actualCount,
            targetCount: habit.targetCount,
            unit: habit.targetUnit,
            notes: options.notes,
            metadata,
            updatedAt: new Date().toISOString()
          });
          logsUpdated++;
        } else {
          // Create new log
          const newLog = {
            id: generateId('log'),
            habitId: options.habitId,
            userId: config.userId,
            logDate: logDate.toISOString(),
            status,
            actualCount,
            targetCount: habit.targetCount,
            unit: habit.targetUnit,
            notes: options.notes,
            metadata,
            createdAt: new Date().toISOString()
          };

          await appendLog(newLog);
          logsCreated++;
        }
      }

      // Recalculate streaks
      const allLogs = await loadLogs(options.habitId, year);
      const streakInfo = calculateStreak(habit, allLogs);

      // Update habit with new streak info
      await updateHabit(options.habitId, {
        currentStreak: streakInfo.currentStreak,
        longestStreak: streakInfo.longestStreak
      });

      console.log(JSON.stringify({
        success: true,
        logsCreated,
        logsUpdated,
        streakUpdate: {
          currentStreak: streakInfo.currentStreak,
          longestStreak: streakInfo.longestStreak,
          perfectStreak: streakInfo.perfectStreak,
          streakQuality: streakInfo.streakQuality
        }
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
