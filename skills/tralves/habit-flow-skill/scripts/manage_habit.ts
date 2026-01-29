#!/usr/bin/env node
/**
 * Manage Habit Script
 * Create, update, archive, and delete habits
 */

import { Command } from 'commander';
import {
  loadHabits,
  saveHabits,
  generateId,
  loadConfig
} from '../src/storage.js';
import {
  HabitCategory,
  HabitFrequency,
  CreateHabitInput,
  UpdateHabitInput
} from '../src/types.js';

const program = new Command();

program
  .name('manage_habit')
  .description('Create, update, archive, and delete habits');

// Create command
program
  .command('create')
  .description('Create a new habit')
  .requiredOption('--name <name>', 'Habit name')
  .option('--description <description>', 'Habit description')
  .requiredOption('--category <category>', 'Habit category')
  .requiredOption('--frequency <frequency>', 'Habit frequency (daily, weekly, monthly, custom)')
  .requiredOption('--target-count <count>', 'Target count', parseInt)
  .option('--target-unit <unit>', 'Target unit (e.g., session, glasses, miles)')
  .option('--reminder <times...>', 'Reminder times in HH:MM format')
  .option('--reminder-message <message>', 'Custom reminder message')
  .option('--reminder-channel <channel>', 'Delivery channel: last (default), whatsapp, telegram, discord, slack, imessage')
  .option('--reminder-to <recipient>', 'Specific recipient (E.164 phone, Telegram chatId, etc.)')
  .option('--start-date <date>', 'Start date (ISO format)')
  .action(async (options) => {
    try {
      const config = await loadConfig();
      const data = await loadHabits();

      const now = new Date().toISOString();
      const habitId = generateId('h');

      const newHabit = {
        id: habitId,
        userId: config.userId,
        name: options.name,
        description: options.description,
        category: options.category as HabitCategory,
        frequency: options.frequency as HabitFrequency,
        targetCount: options.targetCount,
        targetUnit: options.targetUnit || 'session',
        reminderSettings: options.reminder ? {
          enabled: true,
          times: options.reminder,
          message: options.reminderMessage,
          channel: options.reminderChannel || 'last',
          to: options.reminderTo
        } : undefined,
        isActive: true,
        startDate: options.startDate || now,
        currentStreak: 0,
        longestStreak: 0,
        createdAt: now,
        updatedAt: now
      };

      data.habits.push(newHabit);
      await saveHabits(data);

      console.log(JSON.stringify({
        success: true,
        habit: newHabit,
        message: `Habit "${options.name}" created successfully`
      }, null, 2));
    } catch (error: any) {
      console.error(JSON.stringify({
        success: false,
        error: error.message
      }, null, 2));
      process.exit(1);
    }
  });

// Update command
program
  .command('update')
  .description('Update an existing habit')
  .requiredOption('--habit-id <id>', 'Habit ID')
  .option('--name <name>', 'New habit name')
  .option('--description <description>', 'New description')
  .option('--category <category>', 'New category')
  .option('--frequency <frequency>', 'New frequency')
  .option('--target-count <count>', 'New target count', parseInt)
  .option('--target-unit <unit>', 'New target unit')
  .option('--reminder <times...>', 'New reminder times')
  .option('--reminder-enabled <enabled>', 'Enable/disable reminders', (val) => val === 'true')
  .option('--reminder-message <message>', 'New reminder message')
  .option('--reminder-channel <channel>', 'Delivery channel: last, whatsapp, telegram, discord, slack, imessage')
  .option('--reminder-to <recipient>', 'Specific recipient (E.164 phone, Telegram chatId, etc.)')
  .action(async (options) => {
    try {
      const data = await loadHabits();
      const habitIndex = data.habits.findIndex(h => h.id === options.habitId);

      if (habitIndex === -1) {
        throw new Error(`Habit with id ${options.habitId} not found`);
      }

      const updates: UpdateHabitInput = {};
      if (options.name !== undefined) updates.name = options.name;
      if (options.description !== undefined) updates.description = options.description;
      if (options.category !== undefined) updates.category = options.category as HabitCategory;
      if (options.frequency !== undefined) updates.frequency = options.frequency as HabitFrequency;
      if (options.targetCount !== undefined) updates.targetCount = options.targetCount;
      if (options.targetUnit !== undefined) updates.targetUnit = options.targetUnit;

      if (options.reminder || options.reminderEnabled !== undefined || options.reminderMessage || options.reminderChannel || options.reminderTo) {
        updates.reminderSettings = {
          ...data.habits[habitIndex].reminderSettings,
          enabled: options.reminderEnabled ?? data.habits[habitIndex].reminderSettings?.enabled ?? false,
          times: options.reminder ?? data.habits[habitIndex].reminderSettings?.times ?? [],
          message: options.reminderMessage ?? data.habits[habitIndex].reminderSettings?.message,
          channel: options.reminderChannel ?? data.habits[habitIndex].reminderSettings?.channel ?? 'last',
          to: options.reminderTo ?? data.habits[habitIndex].reminderSettings?.to
        };
      }

      data.habits[habitIndex] = {
        ...data.habits[habitIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await saveHabits(data);

      console.log(JSON.stringify({
        success: true,
        habit: data.habits[habitIndex],
        message: `Habit updated successfully`
      }, null, 2));
    } catch (error: any) {
      console.error(JSON.stringify({
        success: false,
        error: error.message
      }, null, 2));
      process.exit(1);
    }
  });

// Archive command
program
  .command('archive')
  .description('Archive a habit (soft delete)')
  .requiredOption('--habit-id <id>', 'Habit ID')
  .action(async (options) => {
    try {
      const data = await loadHabits();
      const habitIndex = data.habits.findIndex(h => h.id === options.habitId);

      if (habitIndex === -1) {
        throw new Error(`Habit with id ${options.habitId} not found`);
      }

      data.habits[habitIndex].isActive = false;
      data.habits[habitIndex].updatedAt = new Date().toISOString();
      data.habits[habitIndex].endDate = new Date().toISOString();

      await saveHabits(data);

      console.log(JSON.stringify({
        success: true,
        habit: data.habits[habitIndex],
        message: `Habit archived successfully`
      }, null, 2));
    } catch (error: any) {
      console.error(JSON.stringify({
        success: false,
        error: error.message
      }, null, 2));
      process.exit(1);
    }
  });

// Delete command
program
  .command('delete')
  .description('Permanently delete a habit')
  .requiredOption('--habit-id <id>', 'Habit ID')
  .requiredOption('--confirm', 'Confirm deletion')
  .action(async (options) => {
    try {
      const data = await loadHabits();
      const habitIndex = data.habits.findIndex(h => h.id === options.habitId);

      if (habitIndex === -1) {
        throw new Error(`Habit with id ${options.habitId} not found`);
      }

      const deletedHabit = data.habits[habitIndex];
      data.habits.splice(habitIndex, 1);

      await saveHabits(data);

      console.log(JSON.stringify({
        success: true,
        deletedHabit,
        message: `Habit permanently deleted`
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
