#!/usr/bin/env node
/**
 * Canvas Dashboard Script
 * Generate Canvas visualizations for HabitFlow
 */

import { Command } from 'commander';
import fs from 'fs';
import { renderStreakChart } from './components/streak-chart.js';
import { renderCompletionHeatmap } from './components/completion-heatmap.js';
import { renderTrendsChart } from './components/trends-chart.js';
import { renderMultiHabitOverview } from './components/multi-habit-overview.js';

const program = new Command();

program
  .name('canvas-dashboard')
  .description('Generate Canvas visualizations for HabitFlow')
  .version('1.0.0');

program
  .command('streak')
  .description('Generate streak chart for a habit')
  .requiredOption('--habit-id <id>', 'Habit ID')
  .option('--theme <theme>', 'Theme (light/dark)', 'light')
  .option('--output <path>', 'Output file path', './streak-chart.png')
  .action(async (options) => {
    try {
      const canvas = await renderStreakChart(options.habitId, options.theme as 'light' | 'dark');
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(options.output, buffer);
      console.log(`Streak chart saved to: ${options.output}`);
    } catch (error: any) {
      console.error(`Error generating streak chart: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('heatmap')
  .description('Generate completion heatmap for a habit')
  .requiredOption('--habit-id <id>', 'Habit ID')
  .option('--days <number>', 'Number of days to show', '90')
  .option('--theme <theme>', 'Theme (light/dark)', 'light')
  .option('--output <path>', 'Output file path', './heatmap.png')
  .action(async (options) => {
    try {
      const canvas = await renderCompletionHeatmap(
        options.habitId,
        parseInt(options.days),
        options.theme as 'light' | 'dark'
      );
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(options.output, buffer);
      console.log(`Heatmap saved to: ${options.output}`);
    } catch (error: any) {
      console.error(`Error generating heatmap: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('trends')
  .description('Generate weekly trends chart for a habit')
  .requiredOption('--habit-id <id>', 'Habit ID')
  .option('--weeks <number>', 'Number of weeks to show', '8')
  .option('--theme <theme>', 'Theme (light/dark)', 'light')
  .option('--output <path>', 'Output file path', './trends-chart.png')
  .action(async (options) => {
    try {
      const canvas = await renderTrendsChart(
        options.habitId,
        parseInt(options.weeks),
        options.theme as 'light' | 'dark'
      );
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(options.output, buffer);
      console.log(`Trends chart saved to: ${options.output}`);
    } catch (error: any) {
      console.error(`Error generating trends chart: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('dashboard')
  .description('Generate multi-habit overview dashboard')
  .option('--theme <theme>', 'Theme (light/dark)', 'light')
  .option('--output <path>', 'Output file path', './dashboard.png')
  .action(async (options) => {
    try {
      const canvas = await renderMultiHabitOverview(options.theme as 'light' | 'dark');
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(options.output, buffer);
      console.log(`Dashboard saved to: ${options.output}`);
    } catch (error: any) {
      console.error(`Error generating dashboard: ${error.message}`);
      process.exit(1);
    }
  });

program.parse();
