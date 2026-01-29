#!/usr/bin/env node
/**
 * View Habits Script
 * Query and display habits in various formats
 */

import { Command } from 'commander';
import { loadHabits } from '../src/storage.js';
import { Habit } from '../src/types.js';

const program = new Command();

program
  .name('view_habits')
  .description('Query and display habits')
  .option('--active', 'Show only active habits')
  .option('--archived', 'Show only archived habits')
  .option('--search <query>', 'Search habits by name')
  .option('--habit-id <id>', 'Get specific habit by ID')
  .option('--format <format>', 'Output format (json, markdown, text)', 'json')
  .action(async (options) => {
    try {
      const data = await loadHabits();
      let habits = data.habits;

      // Apply filters
      if (options.active) {
        habits = habits.filter(h => h.isActive);
      }

      if (options.archived) {
        habits = habits.filter(h => !h.isActive);
      }

      if (options.search) {
        const query = options.search.toLowerCase();
        habits = habits.filter(h =>
          h.name.toLowerCase().includes(query) ||
          h.description?.toLowerCase().includes(query)
        );
      }

      if (options.habitId) {
        const habit = habits.find(h => h.id === options.habitId);
        if (!habit) {
          throw new Error(`Habit with id ${options.habitId} not found`);
        }
        habits = [habit];
      }

      // Format output
      if (options.format === 'json') {
        console.log(JSON.stringify({ habits }, null, 2));
      } else if (options.format === 'markdown') {
        console.log(formatAsMarkdown(habits));
      } else if (options.format === 'text') {
        console.log(formatAsText(habits));
      } else {
        throw new Error(`Unknown format: ${options.format}`);
      }
    } catch (error: any) {
      console.error(JSON.stringify({
        success: false,
        error: error.message
      }, null, 2));
      process.exit(1);
    }
  });

function formatAsMarkdown(habits: Habit[]): string {
  if (habits.length === 0) {
    return 'No habits found.';
  }

  let output = '# Habits\n\n';
  output += '| Name | Category | Frequency | Target | Streak | Status |\n';
  output += '|------|----------|-----------|--------|--------|--------|\n';

  for (const habit of habits) {
    const target = `${habit.targetCount} ${habit.targetUnit || 'session'}`;
    const status = habit.isActive ? '✅ Active' : '📦 Archived';
    output += `| ${habit.name} | ${habit.category} | ${habit.frequency} | ${target} | 🔥 ${habit.currentStreak} | ${status} |\n`;
  }

  return output;
}

function formatAsText(habits: Habit[]): string {
  if (habits.length === 0) {
    return 'No habits found.';
  }

  let output = '';
  for (let i = 0; i < habits.length; i++) {
    const habit = habits[i];
    const status = habit.isActive ? 'Active' : 'Archived';

    output += `\n${i + 1}. ${habit.name}\n`;
    output += `   ID: ${habit.id}\n`;
    output += `   Category: ${habit.category}\n`;
    output += `   Frequency: ${habit.frequency}\n`;
    output += `   Target: ${habit.targetCount} ${habit.targetUnit || 'session'}\n`;
    output += `   Current Streak: ${habit.currentStreak} days\n`;
    output += `   Longest Streak: ${habit.longestStreak} days\n`;
    output += `   Status: ${status}\n`;

    if (habit.description) {
      output += `   Description: ${habit.description}\n`;
    }

    if (habit.reminderSettings?.enabled) {
      output += `   Reminders: ${habit.reminderSettings.times.join(', ')}\n`;
    }
  }

  return output;
}

program.parse();
