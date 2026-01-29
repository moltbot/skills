/**
 * Completion Heatmap Component
 * Renders a GitHub-style calendar heatmap of daily completions
 */

import { Canvas } from '@napi-rs/canvas';
import { createChartCanvas, drawBackground, drawTitle, drawHeatmapCell } from '../utils/chart-renderer.js';
import { aggregateCompletionHeatmap } from '../utils/data-aggregator.js';
import { STATUS_COLORS } from '../utils/color-schemes.js';

export async function renderCompletionHeatmap(
  habitId: string,
  days: number = 90,
  theme: 'light' | 'dark' = 'light'
): Promise<Canvas> {
  const cellSize = 12;
  const cellGap = 2;
  const weeks = Math.ceil(days / 7);
  const width = Math.max(600, (cellSize + cellGap) * weeks + 150);
  const height = (cellSize + cellGap) * 7 + 140;

  const canvas = createChartCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Draw background
  drawBackground(ctx, width, height, theme);

  // Load data
  const completions = await aggregateCompletionHeatmap(habitId, days);

  // Draw title
  drawTitle(ctx, 'Completion Heatmap', 20, 40, theme);

  // Draw day labels
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  ctx.fillStyle = theme === 'light' ? '#6b7280' : '#d1d5db';
  ctx.font = '10px sans-serif';
  dayLabels.forEach((label, i) => {
    ctx.fillText(label, 5, 80 + (i * (cellSize + cellGap)) + 10);
  });

  // Draw heatmap grid
  const startX = 50;
  const startY = 70;

  // Get the day of week for the first date to align properly
  const firstDate = new Date(completions[0]?.date || new Date());
  const firstDayOfWeek = firstDate.getDay();

  completions.forEach((day, index) => {
    const date = new Date(day.date);
    const dayOfWeek = date.getDay();

    // Calculate week index based on days elapsed from start
    const weekIndex = Math.floor((index + firstDayOfWeek) / 7);

    const x = startX + (weekIndex * (cellSize + cellGap));
    const y = startY + (dayOfWeek * (cellSize + cellGap));

    drawHeatmapCell(
      ctx,
      x,
      y,
      cellSize,
      day.completionPercentage,
      day.status
    );
  });

  // Draw legend
  const legendY = height - 40;
  ctx.fillStyle = theme === 'light' ? '#111827' : '#f9fafb';
  ctx.font = '12px sans-serif';
  ctx.fillText('Legend:', 50, legendY);

  const statuses = [
    { label: 'Completed', status: 'completed' },
    { label: 'Partial', status: 'partial' },
    { label: 'Missed', status: 'missed' },
    { label: 'Skipped', status: 'skipped' }
  ];

  statuses.forEach((item, i) => {
    const legendX = 120 + (i * 100);
    drawHeatmapCell(ctx, legendX, legendY - 10, 12, 100, item.status);
    ctx.fillText(item.label, legendX + 18, legendY);
  });

  return canvas;
}
