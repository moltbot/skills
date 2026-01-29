/**
 * Streak Chart Component
 * Renders a bar chart showing current vs longest streak
 */

import { Canvas } from '@napi-rs/canvas';
import { createChartCanvas, drawBackground, drawTitle, drawBarChart } from '../utils/chart-renderer.js';
import { aggregateStreakData } from '../utils/data-aggregator.js';
import { QUALITY_COLORS } from '../utils/color-schemes.js';

export async function renderStreakChart(
  habitId: string,
  theme: 'light' | 'dark' = 'light'
): Promise<Canvas> {
  const width = 800;
  const height = 400;
  const canvas = createChartCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Draw background
  drawBackground(ctx, width, height, theme);

  // Load data
  const streakData = await aggregateStreakData(habitId);

  // Draw title
  drawTitle(ctx, `${streakData.habitName} - Streak`, 20, 40, theme);

  // Prepare bar data
  const bars = [
    {
      label: 'Current',
      value: streakData.currentStreak,
      color: QUALITY_COLORS[streakData.streakQuality] || QUALITY_COLORS.fair
    },
    {
      label: 'Longest',
      value: streakData.longestStreak,
      color: '#6b7280'
    }
  ];

  // Draw bars
  drawBarChart(ctx, bars, 50, 100, width - 100, height - 150);

  // Draw quality indicator
  ctx.fillStyle = theme === 'light' ? '#6b7280' : '#d1d5db';
  ctx.font = '16px sans-serif';
  ctx.fillText(
    `Quality: ${streakData.streakQuality.toUpperCase()}`,
    50,
    height - 20
  );

  // Draw forgiveness info
  ctx.fillText(
    `Forgiveness days used: ${streakData.forgivenessDaysUsed}/1`,
    300,
    height - 20
  );

  return canvas;
}
