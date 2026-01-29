/**
 * Multi-Habit Overview Component
 * Renders a dashboard grid showing all active habits
 */

import { Canvas } from '@napi-rs/canvas';
import { createChartCanvas, drawBackground, drawTitle } from '../utils/chart-renderer.js';
import { aggregateMultiHabitData } from '../utils/data-aggregator.js';
import { QUALITY_COLORS, CATEGORY_COLORS } from '../utils/color-schemes.js';

export async function renderMultiHabitOverview(
  theme: 'light' | 'dark' = 'light'
): Promise<Canvas> {
  const width = 800;
  const height = 600;
  const canvas = createChartCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Draw background
  drawBackground(ctx, width, height, theme);

  // Load data
  const habits = await aggregateMultiHabitData();

  // Draw title
  drawTitle(ctx, 'All Habits Dashboard', 20, 40, theme);

  if (habits.length === 0) {
    ctx.fillStyle = theme === 'light' ? '#6b7280' : '#d1d5db';
    ctx.font = '16px sans-serif';
    ctx.fillText('No active habits found', 50, 100);
    return canvas;
  }

  // Draw habit cards in grid
  const cardWidth = 350;
  const cardHeight = 80;
  const cardsPerRow = 2;
  const startX = 50;
  const startY = 80;

  habits.forEach((habit, index) => {
    const row = Math.floor(index / cardsPerRow);
    const col = index % cardsPerRow;

    const x = startX + (col * (cardWidth + 20));
    const y = startY + (row * (cardHeight + 20));

    // Card background
    ctx.fillStyle = theme === 'light' ? '#f3f4f6' : '#374151';
    ctx.fillRect(x, y, cardWidth, cardHeight);

    // Category indicator
    ctx.fillStyle = CATEGORY_COLORS[habit.category] || CATEGORY_COLORS.other;
    ctx.fillRect(x, y, 5, cardHeight);

    // Habit name
    ctx.fillStyle = theme === 'light' ? '#111827' : '#f9fafb';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(habit.name, x + 15, y + 25);

    // Streak info
    ctx.fillStyle = QUALITY_COLORS[habit.streakQuality] || QUALITY_COLORS.fair;
    ctx.font = '14px sans-serif';
    ctx.fillText(`${habit.currentStreak} day streak`, x + 15, y + 50);

    // Quality badge
    ctx.fillStyle = theme === 'light' ? '#6b7280' : '#d1d5db';
    ctx.font = '12px sans-serif';
    ctx.fillText(habit.streakQuality.toUpperCase(), x + 15, y + 68);
  });

  // Summary stats
  const totalHabits = habits.length;
  const avgStreak = Math.round(
    habits.reduce((sum, h) => sum + h.currentStreak, 0) / totalHabits
  );

  ctx.fillStyle = theme === 'light' ? '#111827' : '#f9fafb';
  ctx.font = '14px sans-serif';
  ctx.fillText(
    `Total habits: ${totalHabits} | Average streak: ${avgStreak} days`,
    50,
    height - 30
  );

  return canvas;
}
