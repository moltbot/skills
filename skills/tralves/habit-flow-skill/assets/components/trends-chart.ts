/**
 * Trends Chart Component
 * Renders a line chart showing weekly completion rates
 */

import { Canvas } from '@napi-rs/canvas';
import { createChartCanvas, drawBackground, drawTitle, drawLineChart, drawGridLines } from '../utils/chart-renderer.js';
import { aggregateWeeklyTrends } from '../utils/data-aggregator.js';

export async function renderTrendsChart(
  habitId: string,
  weeks: number = 8,
  theme: 'light' | 'dark' = 'light'
): Promise<Canvas> {
  const width = 800;
  const height = 400;
  const canvas = createChartCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Draw background
  drawBackground(ctx, width, height, theme);

  // Load data
  const trends = await aggregateWeeklyTrends(habitId, weeks);

  // Draw title
  drawTitle(ctx, 'Weekly Completion Rate (%)', 20, 40, theme);

  // Prepare line data
  const lineData = trends.map(week => ({
    label: new Date(week.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: week.completionRate
  }));

  const chartX = 50;
  const chartY = 100;
  const chartWidth = width - 100;
  const chartHeight = height - 150;

  // Draw grid lines
  drawGridLines(ctx, chartX, chartY, chartWidth, chartHeight, theme);

  // Draw Y-axis labels
  ctx.fillStyle = theme === 'light' ? '#6b7280' : '#d1d5db';
  ctx.font = '12px sans-serif';
  for (let i = 0; i <= 100; i += 25) {
    const y = chartY + ((100 - i) / 100) * chartHeight;
    ctx.fillText(`${i}%`, 10, y + 5);
  }

  // Draw line chart
  drawLineChart(ctx, lineData, chartX, chartY, chartWidth, chartHeight, theme);

  // Draw X-axis labels
  ctx.fillStyle = theme === 'light' ? '#6b7280' : '#d1d5db';
  ctx.font = '12px sans-serif';
  lineData.forEach((item, i) => {
    const x = chartX + (i * (chartWidth / Math.max(lineData.length - 1, 1)));
    ctx.save();
    ctx.translate(x, height - 30);
    ctx.rotate(-Math.PI / 4);
    ctx.fillText(item.label, 0, 0);
    ctx.restore();
  });

  return canvas;
}
