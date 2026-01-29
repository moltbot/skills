/**
 * Data Aggregator
 * Loads and transforms habit data for visualizations
 */

import { loadHabits, loadLogs } from '../../src/storage.js';
import { calculateStreak } from '../../src/streak-calculation.js';
import { getLastLogPerDay, getDailyCompletionsInRange } from '../../src/daily-completion.js';
import { HabitStreakData, DailyCompletionData, WeeklyTrendData, MultiHabitData } from '../types/canvas-types.js';
import { HabitLogStatus } from '../../src/types.js';

/**
 * Aggregate streak data for a habit
 */
export async function aggregateStreakData(habitId: string): Promise<HabitStreakData> {
  const data = await loadHabits();
  const habit = data.habits.find(h => h.id === habitId);

  if (!habit) {
    throw new Error(`Habit with id ${habitId} not found`);
  }

  const year = new Date().getFullYear();
  const logs = await loadLogs(habitId, year);
  const streakInfo = calculateStreak(habit, logs);

  return {
    habitId: habit.id,
    habitName: habit.name,
    currentStreak: streakInfo.currentStreak,
    longestStreak: streakInfo.longestStreak,
    streakQuality: streakInfo.streakQuality,
    forgivenessDaysUsed: streakInfo.forgivenessDaysUsed
  };
}

/**
 * Aggregate completion heatmap data for a habit
 */
export async function aggregateCompletionHeatmap(
  habitId: string,
  days: number = 90
): Promise<DailyCompletionData[]> {
  const year = new Date().getFullYear();
  const logs = await loadLogs(habitId, year);

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const completions = getDailyCompletionsInRange(logs, startDate, endDate);

  // Fill in missing days with "missed" status
  const result: DailyCompletionData[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const completion = completions.find(c => c.date === dateStr);

    if (completion) {
      result.push({
        date: dateStr,
        status: completion.status,
        completionPercentage: completion.completionPercentage
      });
    } else {
      // Missing day = missed
      result.push({
        date: dateStr,
        status: HabitLogStatus.MISSED,
        completionPercentage: 0
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

/**
 * Aggregate weekly trend data for a habit
 */
export async function aggregateWeeklyTrends(
  habitId: string,
  weeks: number = 8
): Promise<WeeklyTrendData[]> {
  const year = new Date().getFullYear();
  const logs = await loadLogs(habitId, year);
  const dailyCompletions = getLastLogPerDay(logs);

  const trends: WeeklyTrendData[] = [];
  const endDate = new Date();

  for (let i = weeks - 1; i >= 0; i--) {
    const weekEnd = new Date(endDate);
    weekEnd.setDate(endDate.getDate() - (i * 7));

    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6);

    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    // Count completions in this week
    const weekCompletions = dailyCompletions.filter(c =>
      c.date >= weekStartStr && c.date <= weekEndStr && c.isCompleted
    );

    const completionRate = (weekCompletions.length / 7) * 100;

    trends.push({
      weekStart: weekStartStr,
      completionRate: Math.round(completionRate)
    });
  }

  return trends;
}

/**
 * Aggregate data for all active habits
 */
export async function aggregateMultiHabitData(): Promise<MultiHabitData[]> {
  const data = await loadHabits();
  const activeHabits = data.habits.filter(h => h.isActive);

  const habitData: MultiHabitData[] = [];

  for (const habit of activeHabits) {
    try {
      const streakData = await aggregateStreakData(habit.id);
      habitData.push({
        id: habit.id,
        name: habit.name,
        category: habit.category,
        currentStreak: streakData.currentStreak,
        streakQuality: streakData.streakQuality
      });
    } catch (error) {
      console.error(`Error loading data for habit ${habit.id}:`, error);
      // Skip habits with errors
    }
  }

  return habitData;
}
