#!/usr/bin/env node
/**
 * Get Statistics Script
 * Generate habit statistics and analytics
 */

import { Command } from 'commander';
import { loadHabits, loadLogs } from '../src/storage.js';
import { HabitLogStatus } from '../src/types.js';
import { getLastLogPerDay } from '../src/daily-completion.js';

const program = new Command();

program
  .name('get_stats')
  .description('Generate habit statistics')
  .option('--habit-id <id>', 'Specific habit ID')
  .option('--all', 'Stats for all habits')
  .option('--period <days>', 'Period in days (default: 30)', parseInt, 30)
  .option('--format <format>', 'Output format (json, text)', 'json')
  .action(async (options) => {
    try {
      const data = await loadHabits();
      let habits = data.habits;

      if (options.habitId) {
        const habit = habits.find(h => h.id === options.habitId);
        if (!habit) {
          throw new Error(`Habit with id ${options.habitId} not found`);
        }
        habits = [habit];
      } else if (!options.all) {
        throw new Error('Please specify --habit-id or --all');
      }

      const stats = [];

      for (const habit of habits) {
        const year = new Date().getFullYear();
        const logs = await loadLogs(habit.id, year);
        const dailyCompletions = getLastLogPerDay(logs);

        // Filter by period
        const periodStart = new Date();
        periodStart.setDate(periodStart.getDate() - options.period);
        const periodStartStr = periodStart.toISOString().split('T')[0];

        const periodCompletions = dailyCompletions.filter(
          dc => dc.date >= periodStartStr
        );

        // Calculate stats
        const totalDays = options.period;
        const completedDays = periodCompletions.filter(dc => dc.isCompleted).length;
        const partialDays = periodCompletions.filter(dc => dc.status === HabitLogStatus.PARTIAL).length;
        const missedDays = totalDays - periodCompletions.length;

        const completionRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

        const totalActualCount = periodCompletions.reduce((sum, dc) => sum + dc.actualCount, 0);
        const averageActualCount = periodCompletions.length > 0 ? totalActualCount / periodCompletions.length : 0;

        // Determine trend (last 7 days vs previous 7 days)
        const last7Start = new Date();
        last7Start.setDate(last7Start.getDate() - 7);
        const last7StartStr = last7Start.toISOString().split('T')[0];

        const prev7Start = new Date();
        prev7Start.setDate(prev7Start.getDate() - 14);
        const prev7StartStr = prev7Start.toISOString().split('T')[0];

        const last7 = periodCompletions.filter(dc => dc.date >= last7StartStr);
        const prev7 = periodCompletions.filter(dc => dc.date >= prev7StartStr && dc.date < last7StartStr);

        const last7Rate = last7.length > 0 ? (last7.filter(dc => dc.isCompleted).length / 7) * 100 : 0;
        const prev7Rate = prev7.length > 0 ? (prev7.filter(dc => dc.isCompleted).length / 7) * 100 : 0;

        let trend = 'stable';
        if (last7Rate > prev7Rate + 10) trend = 'improving';
        if (last7Rate < prev7Rate - 10) trend = 'declining';

        // Find best day of week
        const dayOfWeekCounts: Record<string, number> = {
          Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0
        };
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (const dc of periodCompletions) {
          if (dc.isCompleted) {
            const date = new Date(dc.date);
            const dayName = dayNames[date.getDay()];
            dayOfWeekCounts[dayName]++;
          }
        }

        const bestDay = Object.entries(dayOfWeekCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];

        stats.push({
          habitId: habit.id,
          habitName: habit.name,
          period: options.period,
          completionRate: Math.round(completionRate * 10) / 10,
          completedDays,
          partialDays,
          missedDays,
          totalDays,
          averageActualCount: Math.round(averageActualCount * 10) / 10,
          currentStreak: habit.currentStreak,
          longestStreak: habit.longestStreak,
          trend,
          bestDayOfWeek: bestDay
        });
      }

      if (options.format === 'json') {
        console.log(JSON.stringify({ success: true, stats }, null, 2));
      } else if (options.format === 'text') {
        for (const stat of stats) {
          console.log(`\nStatistics for "${stat.habitName}" (last ${stat.period} days):`);
          console.log(`  Completion Rate: ${stat.completionRate}%`);
          console.log(`  Completed Days: ${stat.completedDays}/${stat.totalDays}`);
          console.log(`  Current Streak: ${stat.currentStreak} days`);
          console.log(`  Longest Streak: ${stat.longestStreak} days`);
          console.log(`  Trend: ${stat.trend}`);
          console.log(`  Best Day: ${stat.bestDayOfWeek}`);
          console.log(`  Average Count: ${stat.averageActualCount}`);
        }
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
