/**
 * Chart Renderer Utilities
 * Canvas drawing functions for visualizations
 */

import { createCanvas, Canvas, SKRSContext2D } from '@napi-rs/canvas';
import { STATUS_COLORS } from './color-schemes.js';

export function createChartCanvas(width: number, height: number): Canvas {
  return createCanvas(width, height);
}

export function drawBackground(
  ctx: SKRSContext2D,
  width: number,
  height: number,
  theme: 'light' | 'dark'
) {
  ctx.fillStyle = theme === 'light' ? '#ffffff' : '#1f2937';
  ctx.fillRect(0, 0, width, height);
}

export function drawTitle(
  ctx: SKRSContext2D,
  title: string,
  x: number,
  y: number,
  theme: 'light' | 'dark'
) {
  ctx.fillStyle = theme === 'light' ? '#111827' : '#f9fafb';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(title, x, y);
}

export function drawBarChart(
  ctx: SKRSContext2D,
  data: { label: string; value: number; color: string }[],
  x: number,
  y: number,
  width: number,
  height: number
) {
  const barWidth = width / data.length;
  const maxValue = Math.max(...data.map(d => d.value), 1); // Avoid division by zero

  data.forEach((item, i) => {
    const barHeight = (item.value / maxValue) * height;
    const barX = x + (i * barWidth);
    const barY = y + height - barHeight;

    // Draw bar
    ctx.fillStyle = item.color;
    ctx.fillRect(barX + 5, barY, barWidth - 10, barHeight);

    // Label
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px sans-serif';
    ctx.fillText(item.label, barX + 5, y + height + 15);

    // Value
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(item.value.toString(), barX + 5, barY - 5);
  });
}

export function drawHeatmapCell(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  size: number,
  intensity: number,
  status: string
) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.missed;
  ctx.fillStyle = color;
  ctx.globalAlpha = Math.max(0.2, intensity / 100);
  ctx.fillRect(x, y, size, size);
  ctx.globalAlpha = 1.0;
}

export function drawLineChart(
  ctx: SKRSContext2D,
  data: { label: string; value: number }[],
  x: number,
  y: number,
  width: number,
  height: number,
  theme: 'light' | 'dark'
) {
  if (data.length === 0) return;

  const pointSpacing = data.length > 1 ? width / (data.length - 1) : width / 2;
  const maxValue = Math.max(...data.map(d => d.value), 1); // Avoid division by zero

  // Draw line
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 3;
  ctx.beginPath();

  data.forEach((item, i) => {
    const pointX = x + (i * pointSpacing);
    const pointY = y + height - ((item.value / maxValue) * height);

    if (i === 0) {
      ctx.moveTo(pointX, pointY);
    } else {
      ctx.lineTo(pointX, pointY);
    }
  });

  ctx.stroke();

  // Draw points
  data.forEach((item, i) => {
    const pointX = x + (i * pointSpacing);
    const pointY = y + height - ((item.value / maxValue) * height);

    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(pointX, pointY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Draw value labels
    ctx.fillStyle = theme === 'light' ? '#111827' : '#f9fafb';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`${item.value}%`, pointX - 10, pointY - 10);
  });
}

export function drawGridLines(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  theme: 'light' | 'dark'
) {
  ctx.strokeStyle = theme === 'light' ? '#e5e7eb' : '#374151';
  ctx.lineWidth = 1;

  // Horizontal grid lines
  for (let i = 0; i <= 4; i++) {
    const lineY = y + (i * height / 4);
    ctx.beginPath();
    ctx.moveTo(x, lineY);
    ctx.lineTo(x + width, lineY);
    ctx.stroke();
  }
}
