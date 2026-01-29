/**
 * Daily Completion Logic
 * Implements logic to ensure only the last log per day counts for habit completion
 * Adapted from @habit-flow/shared/calculations
 */

import { HabitLog, HabitLogStatus, DailyCompletion } from './types.js';

/**
 * Get the last (most recent) log for each day from a list of habit logs
 * This ensures only the final log per day counts for completion calculation
 *
 * @param logs - Array of habit logs
 * @returns Array of daily completions with only the last log per day
 */
export function getLastLogPerDay(logs: HabitLog[]): DailyCompletion[] {
  if (!logs || logs.length === 0) {
    return [];
  }

  // Group logs by date (ISO date string)
  const logsByDate = new Map<string, HabitLog[]>();

  for (const log of logs) {
    const dateKey = new Date(log.logDate).toISOString().split('T')[0];

    if (!logsByDate.has(dateKey)) {
      logsByDate.set(dateKey, []);
    }

    logsByDate.get(dateKey)!.push(log);
  }

  // Get the last log for each date (sorted by creation time)
  const dailyCompletions: DailyCompletion[] = [];

  for (const [date, dateLogs] of logsByDate.entries()) {
    // Sort logs by creation time (most recent last)
    const sortedLogs = dateLogs.sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Take the last (most recent) log for this date
    const lastLog = sortedLogs[sortedLogs.length - 1];

    // Calculate completion metrics
    const completionPercentage = lastLog.targetCount
      ? Math.min(100, Math.round((lastLog.actualCount / lastLog.targetCount) * 100))
      : 0;

    const isCompleted = lastLog.status === HabitLogStatus.COMPLETED ||
                       (!!lastLog.targetCount && lastLog.actualCount >= lastLog.targetCount);

    dailyCompletions.push({
      date,
      actualCount: lastLog.actualCount,
      targetCount: lastLog.targetCount || 0,
      status: lastLog.status,
      isCompleted,
      completionPercentage,
      logId: lastLog.id
    });
  }

  // Sort by date (oldest first)
  return dailyCompletions.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Check if a specific date has completion based on last log logic
 *
 * @param logs - Array of habit logs
 * @param targetDate - Date to check (ISO string or Date object)
 * @returns Daily completion for the specified date, or null if no logs
 */
export function getDailyCompletion(logs: HabitLog[], targetDate: string | Date): DailyCompletion | null {
  const dateKey = typeof targetDate === 'string'
    ? new Date(targetDate).toISOString().split('T')[0]
    : targetDate.toISOString().split('T')[0];

  const dailyCompletions = getLastLogPerDay(logs);
  return dailyCompletions.find(completion => completion.date === dateKey) || null;
}

/**
 * Get daily completions for a date range
 *
 * @param logs - Array of habit logs
 * @param startDate - Start date (inclusive)
 * @param endDate - End date (inclusive)
 * @returns Array of daily completions within the date range
 */
export function getDailyCompletionsInRange(
  logs: HabitLog[],
  startDate: string | Date,
  endDate: string | Date
): DailyCompletion[] {
  const start = typeof startDate === 'string' ? startDate : startDate.toISOString().split('T')[0];
  const end = typeof endDate === 'string' ? endDate : endDate.toISOString().split('T')[0];

  const dailyCompletions = getLastLogPerDay(logs);

  return dailyCompletions.filter(completion =>
    completion.date >= start && completion.date <= end
  );
}
