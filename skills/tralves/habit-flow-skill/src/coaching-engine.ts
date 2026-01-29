/**
 * Coaching Engine for Proactive Messages
 * Generates personalized coaching messages with persona integration
 */

import { Habit } from './types.js';
import { RiskAssessment, MilestoneDetection, PatternInsight } from './pattern-analyzer.js';
import { loadConfig } from './storage.js';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

export interface CoachingMessage {
  habitId: string;
  messageType: 'milestone' | 'risk' | 'weekly' | 'insight';
  subject: string;
  body: string;
  attachments?: string[]; // Paths to Canvas dashboard images
  priority: 'high' | 'medium' | 'low';
}

export interface WeeklyStats {
  daysCompleted: number;
  completionRate: number;
  trend: number;
}

/**
 * Generate milestone celebration message
 */
export async function generateMilestoneMessage(
  habit: Habit,
  milestone: MilestoneDetection
): Promise<CoachingMessage> {
  const config = await loadConfig();
  const persona = config.activePersona;

  const milestoneNames = {
    week: '7-Day Streak',
    twoWeeks: '2-Week Streak',
    threeWeeks: '3-Week Streak',
    month: '30-Day Streak',
    century: '100-Day Streak'
  };

  const subject = `🎉 ${milestoneNames[milestone.milestoneType]}!`;

  // Generate persona-specific message
  const { generateMessage } = await import('./message-templates.js');
  const body = generateMessage(persona, {
    type: 'milestone',
    habit: habit.name,
    streak: milestone.streakLength,
    isFirst: milestone.isFirst,
    quality: 'perfect'
  });

  // Generate streak chart for attachment
  const chartPath = await generateStreakChart(habit.id);

  return {
    habitId: habit.id,
    messageType: 'milestone',
    subject,
    body,
    attachments: [chartPath],
    priority: 'high'
  };
}

/**
 * Generate risk warning message
 */
export async function generateRiskWarning(
  habit: Habit,
  risk: RiskAssessment
): Promise<CoachingMessage | null> {
  // Only send if risk is high enough
  if (risk.riskScore < 60) return null;

  const config = await loadConfig();
  const persona = config.activePersona;

  const subject = `⚠️ Streak Alert: ${habit.name}`;

  const { generateMessage } = await import('./message-templates.js');
  const body = generateMessage(persona, {
    type: 'risk',
    habit: habit.name,
    streak: habit.currentStreak,
    riskFactors: risk.riskFactors,
    recommendations: risk.recommendations
  });

  // Generate heatmap showing the pattern
  const heatmapPath = await generateHeatmap(habit.id);

  return {
    habitId: habit.id,
    messageType: 'risk',
    subject,
    body,
    attachments: [heatmapPath],
    priority: 'high'
  };
}

/**
 * Generate weekly check-in message
 */
export async function generateWeeklyCheckin(
  habit: Habit,
  weeklyStats: WeeklyStats
): Promise<CoachingMessage> {
  const config = await loadConfig();
  const persona = config.activePersona;

  const subject = `📊 Weekly Progress: ${habit.name}`;

  const { generateMessage } = await import('./message-templates.js');
  const body = generateMessage(persona, {
    type: 'weekly',
    habit: habit.name,
    completionRate: weeklyStats.completionRate,
    daysCompleted: weeklyStats.daysCompleted,
    streak: habit.currentStreak,
    trend: weeklyStats.trend
  });

  // Generate trends chart + heatmap
  const trendsPath = await generateTrendsChart(habit.id);
  const heatmapPath = await generateHeatmap(habit.id);

  return {
    habitId: habit.id,
    messageType: 'weekly',
    subject,
    body,
    attachments: [trendsPath, heatmapPath],
    priority: 'medium'
  };
}

/**
 * Generate pattern insight message
 */
export async function generateInsightMessage(
  habit: Habit,
  insight: PatternInsight
): Promise<CoachingMessage> {
  const config = await loadConfig();
  const persona = config.activePersona;

  const subject = `🔍 Insight: ${habit.name}`;

  const { generateMessage } = await import('./message-templates.js');
  const body = generateMessage(persona, {
    type: 'insight',
    habit: habit.name,
    insightMessage: insight.message,
    insightType: insight.insightType,
    data: insight.data
  });

  // Generate relevant visualization
  const chartPath = insight.insightType === 'dayPattern'
    ? await generateHeatmap(habit.id)
    : await generateTrendsChart(habit.id);

  return {
    habitId: habit.id,
    messageType: 'insight',
    subject,
    body,
    attachments: [chartPath],
    priority: 'low'
  };
}

// Helper functions for Canvas dashboard generation

async function generateStreakChart(habitId: string): Promise<string> {
  const outputPath = `/tmp/streak-${habitId}-${Date.now()}.png`;
  try {
    execSync(
      `npx tsx assets/canvas-dashboard.ts streak --habit-id ${habitId} --output ${outputPath}`,
      { cwd: path.join(process.env.HOME || '~', 'clawd', 'skills', 'habit-flow'), stdio: 'pipe' }
    );
    return outputPath;
  } catch (error) {
    // If chart generation fails, return empty path
    console.warn(`Failed to generate streak chart: ${error}`);
    return '';
  }
}

async function generateHeatmap(habitId: string): Promise<string> {
  const outputPath = `/tmp/heatmap-${habitId}-${Date.now()}.png`;
  try {
    execSync(
      `npx tsx assets/canvas-dashboard.ts heatmap --habit-id ${habitId} --days 30 --output ${outputPath}`,
      { cwd: path.join(process.env.HOME || '~', 'clawd', 'skills', 'habit-flow'), stdio: 'pipe' }
    );
    return outputPath;
  } catch (error) {
    console.warn(`Failed to generate heatmap: ${error}`);
    return '';
  }
}

async function generateTrendsChart(habitId: string): Promise<string> {
  const outputPath = `/tmp/trends-${habitId}-${Date.now()}.png`;
  try {
    execSync(
      `npx tsx assets/canvas-dashboard.ts trends --habit-id ${habitId} --weeks 4 --output ${outputPath}`,
      { cwd: path.join(process.env.HOME || '~', 'clawd', 'skills', 'habit-flow'), stdio: 'pipe' }
    );
    return outputPath;
  } catch (error) {
    console.warn(`Failed to generate trends chart: ${error}`);
    return '';
  }
}
