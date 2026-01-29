/**
 * Pattern Analysis for Proactive Coaching
 * Analyzes habit data to detect risks, milestones, and insights
 */

import { Habit, HabitLog } from './types.js';
import { getLastLogPerDay } from './daily-completion.js';

export interface RiskAssessment {
  habitId: string;
  riskScore: number; // 0-100
  riskFactors: string[];
  recommendations: string[];
}

export interface MilestoneDetection {
  habitId: string;
  milestoneType: 'week' | 'twoWeeks' | 'threeWeeks' | 'month' | 'century';
  streakLength: number;
  isFirst: boolean; // First time reaching this milestone
}

export interface PatternInsight {
  habitId: string;
  insightType: 'dayPattern' | 'improvement' | 'decline' | 'consistency';
  message: string;
  data: Record<string, any>;
}

/**
 * Calculate risk of streak breaking in next 24-48 hours
 */
export function assessRisk(habit: Habit, logs: HabitLog[]): RiskAssessment {
  let riskScore = 0;
  const riskFactors: string[] = [];
  const recommendations: string[] = [];

  const dailyCompletions = getLastLogPerDay(logs);
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Factor 1: Missed yesterday (+40 risk)
  const hasYesterday = dailyCompletions.some(d => d.date === yesterday && d.isCompleted);
  if (!hasYesterday && dailyCompletions.length > 0) {
    riskScore += 40;
    riskFactors.push('Missed yesterday');
    recommendations.push('Use 2-minute rule—just show up');
  }

  // Factor 2: Tomorrow is weak day (+30 risk)
  const tomorrow = new Date(Date.now() + 86400000);
  const tomorrowDay = tomorrow.getDay();
  const tomorrowSuccessRate = calculateDayOfWeekSuccessRate(logs, tomorrowDay);
  if (tomorrowSuccessRate < 50 && tomorrowSuccessRate > 0) {
    riskScore += 30;
    riskFactors.push(`${getDayName(tomorrowDay)} is historically difficult (${tomorrowSuccessRate}% success)`);
    recommendations.push('Set a specific time and location for tomorrow');
  }

  // Factor 3: Weekend approaching (+20 risk)
  if (tomorrowDay === 0 || tomorrowDay === 6) {
    const weekendRate = (calculateDayOfWeekSuccessRate(logs, 0) + calculateDayOfWeekSuccessRate(logs, 6)) / 2;
    if (weekendRate < 60 && weekendRate > 0) {
      riskScore += 20;
      riskFactors.push('Weekend ahead—routine disruption');
      recommendations.push('Plan weekend habit first thing in morning');
    }
  }

  // Factor 4: Declining trend (+10 risk)
  const last7Rate = calculateCompletionRate(logs, 7);
  const prior7Rate = calculateCompletionRate(logs, 14, 7);
  if (last7Rate < prior7Rate - 10 && prior7Rate > 0) {
    riskScore += 10;
    riskFactors.push('Completion rate declining');
    recommendations.push('Reduce friction—make it easier');
  }

  return {
    habitId: habit.id,
    riskScore: Math.min(100, riskScore),
    riskFactors,
    recommendations
  };
}

/**
 * Detect if habit reached a milestone today
 */
export function detectMilestone(habit: Habit): MilestoneDetection | null {
  const streak = habit.currentStreak;

  const milestones = [
    { type: 'week' as const, days: 7 },
    { type: 'twoWeeks' as const, days: 14 },
    { type: 'threeWeeks' as const, days: 21 },
    { type: 'month' as const, days: 30 },
    { type: 'century' as const, days: 100 }
  ];

  for (const milestone of milestones) {
    if (streak === milestone.days) {
      return {
        habitId: habit.id,
        milestoneType: milestone.type,
        streakLength: streak,
        isFirst: habit.longestStreak === streak
      };
    }
  }

  return null;
}

/**
 * Detect interesting patterns in completion data
 */
export function detectPatterns(habit: Habit, logs: HabitLog[]): PatternInsight[] {
  const insights: PatternInsight[] = [];

  // Need at least 2 weeks of data for meaningful patterns
  if (logs.length < 7) {
    return insights;
  }

  // Pattern 1: Best/worst day disparity
  const dayStats = getDayOfWeekStats(logs);
  if (dayStats.length >= 7) {
    const sorted = [...dayStats].sort((a, b) => b.rate - a.rate);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];

    if (best.rate - worst.rate > 30 && worst.rate > 0) {
      insights.push({
        habitId: habit.id,
        insightType: 'dayPattern',
        message: `Your ${best.day} success rate (${best.rate}%) is much higher than ${worst.day} (${worst.rate}%)`,
        data: { bestDay: best, worstDay: worst }
      });
    }
  }

  // Pattern 2: Significant improvement
  const last7 = calculateCompletionRate(logs, 7);
  const prior7 = calculateCompletionRate(logs, 14, 7);
  if (last7 > prior7 + 20 && prior7 > 0) {
    insights.push({
      habitId: habit.id,
      insightType: 'improvement',
      message: `Completion rate jumped ${Math.round(last7 - prior7)}% this week`,
      data: { currentRate: last7, priorRate: prior7, improvement: last7 - prior7 }
    });
  }

  // Pattern 3: High consistency
  if (last7 >= 85) {
    insights.push({
      habitId: habit.id,
      insightType: 'consistency',
      message: `Exceptional consistency this week (${Math.round(last7)}%)`,
      data: { rate: last7 }
    });
  }

  // Pattern 4: Declining trend (warning)
  if (last7 < prior7 - 20 && prior7 > 0) {
    insights.push({
      habitId: habit.id,
      insightType: 'decline',
      message: `Completion rate dropped ${Math.round(prior7 - last7)}% this week`,
      data: { currentRate: last7, priorRate: prior7, decline: prior7 - last7 }
    });
  }

  return insights;
}

// Helper functions

/**
 * Calculate success rate for a specific day of week
 */
function calculateDayOfWeekSuccessRate(logs: HabitLog[], dayOfWeek: number): number {
  const dailyCompletions = getLastLogPerDay(logs);
  const targetDayLogs = dailyCompletions.filter(d => new Date(d.date).getDay() === dayOfWeek);
  if (targetDayLogs.length === 0) return 0;

  const completed = targetDayLogs.filter(d => d.isCompleted).length;
  return Math.round((completed / targetDayLogs.length) * 100);
}

/**
 * Calculate completion rate for a time period
 */
function calculateCompletionRate(logs: HabitLog[], days: number, offset: number = 0): number {
  const dailyCompletions = getLastLogPerDay(logs);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - offset);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);

  const rangeCompletions = dailyCompletions.filter(d => {
    const date = new Date(d.date);
    return date >= startDate && date <= endDate;
  });

  if (rangeCompletions.length === 0) return 0;
  const completed = rangeCompletions.filter(d => d.isCompleted).length;
  return Math.round((completed / rangeCompletions.length) * 100);
}

/**
 * Get completion stats for each day of week
 */
function getDayOfWeekStats(logs: HabitLog[]): Array<{ day: string; rate: number }> {
  const dailyCompletions = getLastLogPerDay(logs);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return dayNames.map((day, index) => {
    const dayLogs = dailyCompletions.filter(d => new Date(d.date).getDay() === index);
    if (dayLogs.length === 0) return { day, rate: 0 };

    const completed = dayLogs.filter(d => d.isCompleted).length;
    return { day, rate: Math.round((completed / dayLogs.length) * 100) };
  });
}

/**
 * Get day name from day index
 */
function getDayName(dayIndex: number): string {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex];
}
