/**
 * Streak Calculation with 1-Day Forgiveness
 * Implements streak counting that maintains streaks if user misses only one day
 * Adapted from @habit-flow/shared/calculations
 */

import { Habit, HabitFrequency, StreakInfo, StreakType, StreakQuality, DailyCompletion } from './types.js';
import { getLastLogPerDay } from './daily-completion.js';
import { HabitLog } from './types.js';

/**
 * Calculate streak information with 1-day forgiveness mechanism
 *
 * @param habit - The habit to calculate streaks for
 * @param logs - Array of habit logs
 * @param forgivenessLimit - Number of missed days allowed (default: 1)
 * @returns Complete streak information
 */
export function calculateStreak(
  habit: Habit,
  logs: HabitLog[],
  forgivenessLimit: number = 1
): StreakInfo {
  const dailyCompletions = getLastLogPerDay(logs);

  if (!dailyCompletions || dailyCompletions.length === 0) {
    return createEmptyStreakInfo(habit);
  }

  // Sort completions by date (newest first for streak calculation)
  const sortedCompletions = [...dailyCompletions].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  const today = new Date().toISOString().split('T')[0];
  let currentStreak = 0;
  let perfectStreak = 0;
  let forgivenessDaysUsed = 0;
  let isStreakActive = false;
  let lastCompletionDate: Date | undefined;
  let streakStartDate: Date | undefined;

  // Calculate current streak (working backwards from most recent)
  let missedDaysInCurrentStreak = 0;

  for (let i = 0; i < sortedCompletions.length; i++) {
    const completion = sortedCompletions[i];
    const completionDate = new Date(completion.date);

    if (completion.isCompleted) {
      currentStreak++;

      // Track perfect streak (consecutive completions without misses)
      if (missedDaysInCurrentStreak === 0) {
        perfectStreak++;
      }

      if (!lastCompletionDate) {
        lastCompletionDate = completionDate;
        isStreakActive = true;
      }

      if (!streakStartDate) {
        streakStartDate = completionDate;
      } else {
        streakStartDate = completionDate; // Keep updating to get the earliest date
      }
    } else {
      // Hit a missed day
      missedDaysInCurrentStreak++;

      if (missedDaysInCurrentStreak <= forgivenessLimit) {
        // Within forgiveness limit, continue streak but count forgiveness day
        forgivenessDaysUsed++;
      } else {
        // Exceeded forgiveness limit, streak breaks
        break;
      }
    }
  }

  // Calculate longest streak (scan all completions)
  const longestStreak = calculateLongestStreak(dailyCompletions, forgivenessLimit);

  // Determine streak quality based on forgiveness days used
  const streakQuality = determineStreakQuality(forgivenessDaysUsed, currentStreak);

  // Calculate next expected date based on habit frequency
  const nextExpectedDate = calculateNextExpectedDate(habit, lastCompletionDate);

  return {
    currentStreak,
    longestStreak,
    perfectStreak,
    streakStartDate,
    lastCompletionDate,
    nextExpectedDate,
    missedDaysInStreak: forgivenessDaysUsed,
    isStreakActive,
    forgivenessDaysUsed,
    forgivenessDaysRemaining: Math.max(0, forgivenessLimit - forgivenessDaysUsed),
    streakType: getStreakTypeFromHabit(habit),
    streakQuality,
    milestones: [],
    recovery: undefined
  };
}

/**
 * Calculate the longest streak in the entire history
 */
function calculateLongestStreak(
  dailyCompletions: DailyCompletion[],
  forgivenessLimit: number
): number {
  if (dailyCompletions.length === 0) return 0;

  const sortedCompletions = [...dailyCompletions].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  let longestStreak = 0;
  let currentTestStreak = 0;
  let missedDaysInStreak = 0;

  for (const completion of sortedCompletions) {
    if (completion.isCompleted) {
      currentTestStreak++;
    } else {
      missedDaysInStreak++;

      if (missedDaysInStreak <= forgivenessLimit) {
        // Continue streak with forgiveness
        continue;
      } else {
        // Streak broken, update longest if needed
        longestStreak = Math.max(longestStreak, currentTestStreak);
        currentTestStreak = 0;
        missedDaysInStreak = 0;
      }
    }
  }

  // Check final streak
  return Math.max(longestStreak, currentTestStreak);
}

/**
 * Determine streak quality based on forgiveness usage
 */
function determineStreakQuality(forgivenessDaysUsed: number, currentStreak: number): StreakQuality {
  if (currentStreak === 0) return StreakQuality.FAIR;
  if (forgivenessDaysUsed === 0) return StreakQuality.PERFECT;
  if (forgivenessDaysUsed <= 2) return StreakQuality.EXCELLENT;
  if (forgivenessDaysUsed <= 5) return StreakQuality.GOOD;
  return StreakQuality.FAIR;
}

/**
 * Get streak type based on habit frequency
 */
function getStreakTypeFromHabit(habit: Habit): StreakType {
  switch (habit.frequency) {
    case HabitFrequency.DAILY:
      return StreakType.DAILY;
    case HabitFrequency.WEEKLY:
      return StreakType.WEEKLY;
    case HabitFrequency.MONTHLY:
      return StreakType.MONTHLY;
    case HabitFrequency.CUSTOM:
      return StreakType.CUSTOM;
    default:
      return StreakType.DAILY;
  }
}

/**
 * Calculate next expected completion date based on habit frequency
 */
function calculateNextExpectedDate(habit: Habit, lastCompletionDate?: Date): Date | undefined {
  if (!lastCompletionDate) {
    // If no previous completion, next expected is today
    return new Date();
  }

  const nextDate = new Date(lastCompletionDate);

  switch (habit.frequency) {
    case HabitFrequency.DAILY:
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case HabitFrequency.WEEKLY:
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case HabitFrequency.MONTHLY:
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case HabitFrequency.CUSTOM:
      // For custom frequency, default to daily
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    default:
      nextDate.setDate(nextDate.getDate() + 1);
  }

  return nextDate;
}

/**
 * Create empty streak info for habits with no completions
 */
function createEmptyStreakInfo(habit: Habit): StreakInfo {
  return {
    currentStreak: 0,
    longestStreak: 0,
    perfectStreak: 0,
    streakStartDate: undefined,
    lastCompletionDate: undefined,
    nextExpectedDate: new Date(),
    missedDaysInStreak: 0,
    isStreakActive: false,
    forgivenessDaysUsed: 0,
    forgivenessDaysRemaining: 1,
    streakType: getStreakTypeFromHabit(habit),
    streakQuality: StreakQuality.FAIR,
    milestones: [],
    recovery: undefined
  };
}
