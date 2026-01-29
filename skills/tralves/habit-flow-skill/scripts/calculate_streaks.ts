#!/usr/bin/env node
/**
 * Calculate Streaks Script
 * Compute current/longest/perfect streaks with 1-day forgiveness
 */

import { Command } from 'commander';
import { loadHabits, loadLogs, updateHabit } from '../src/storage.js';
import { calculateStreak } from '../src/streak-calculation.js';

const program = new Command();

program
  .name('calculate_streaks')
  .description('Calculate streaks for a habit')
  .requiredOption('--habit-id <id>', 'Habit ID')
  .option('--format <format>', 'Output format (json, text)', 'json')
  .option('--update', 'Update habit with calculated streaks')
  .action(async (options) => {
    try {
      const data = await loadHabits();

      // Find the habit
      const habit = data.habits.find(h => h.id === options.habitId);
      if (!habit) {
        throw new Error(`Habit with id ${options.habitId} not found`);
      }

      // Load logs
      const year = new Date().getFullYear();
      const logs = await loadLogs(options.habitId, year);

      // Calculate streaks
      const streakInfo = calculateStreak(habit, logs);

      // Update habit if requested
      if (options.update) {
        await updateHabit(options.habitId, {
          currentStreak: streakInfo.currentStreak,
          longestStreak: streakInfo.longestStreak
        });
      }

      // Format output
      if (options.format === 'json') {
        console.log(JSON.stringify({
          success: true,
          habitId: options.habitId,
          habitName: habit.name,
          streaks: {
            currentStreak: streakInfo.currentStreak,
            longestStreak: streakInfo.longestStreak,
            perfectStreak: streakInfo.perfectStreak,
            streakQuality: streakInfo.streakQuality,
            isStreakActive: streakInfo.isStreakActive,
            forgivenessDaysUsed: streakInfo.forgivenessDaysUsed,
            forgivenessDaysRemaining: streakInfo.forgivenessDaysRemaining
          }
        }, null, 2));
      } else if (options.format === 'text') {
        console.log(`Streak Information for "${habit.name}"`);
        console.log(`Current Streak: ${streakInfo.currentStreak} days`);
        console.log(`Longest Streak: ${streakInfo.longestStreak} days`);
        console.log(`Perfect Streak: ${streakInfo.perfectStreak} days`);
        console.log(`Streak Quality: ${streakInfo.streakQuality}`);
        console.log(`Streak Active: ${streakInfo.isStreakActive ? 'Yes' : 'No'}`);
        console.log(`Forgiveness Days Used: ${streakInfo.forgivenessDaysUsed}/${streakInfo.forgivenessDaysUsed + streakInfo.forgivenessDaysRemaining}`);
      }
    } catch (error: any) {
      console.error(JSON.stringify({
        success: false,
        error: error.message
      }, null, 2));
      process.exit(1);
    }
  });

program.parse();
