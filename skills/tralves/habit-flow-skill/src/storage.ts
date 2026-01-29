/**
 * Storage utilities for HabitFlow
 * Handles JSON file I/O for habits and logs
 */

import fs from 'fs/promises';
import path from 'path';
import { HabitsData, Habit, HabitLog, UserConfig } from './types.js';

const DATA_DIR = path.join(process.env.HOME || '~', 'clawd', 'habit-flow-data');
const HABITS_FILE = path.join(DATA_DIR, 'habits.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const LOGS_DIR = path.join(DATA_DIR, 'logs');

/**
 * Ensure data directory exists
 */
export async function ensureDataDirectory(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(LOGS_DIR, { recursive: true });
}

/**
 * Load habits from JSON file
 */
export async function loadHabits(): Promise<HabitsData> {
  await ensureDataDirectory();

  try {
    const data = await fs.readFile(HABITS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return empty structure
      return { habits: [] };
    }
    throw error;
  }
}

/**
 * Save habits to JSON file
 */
export async function saveHabits(data: HabitsData): Promise<void> {
  await ensureDataDirectory();
  await fs.writeFile(HABITS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Load user config
 */
export async function loadConfig(): Promise<UserConfig> {
  await ensureDataDirectory();

  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return defaults
      const defaultConfig: UserConfig = {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        activePersona: 'flex',
        userId: 'default-user'
      };
      await saveConfig(defaultConfig);
      return defaultConfig;
    }
    throw error;
  }
}

/**
 * Save user config
 */
export async function saveConfig(config: UserConfig): Promise<void> {
  await ensureDataDirectory();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * Get log file path for a habit and year
 */
export function getLogFilePath(habitId: string, year: number): string {
  return path.join(LOGS_DIR, `${habitId}_${year}.jsonl`);
}

/**
 * Load logs for a habit from JSONL file
 */
export async function loadLogs(habitId: string, year?: number): Promise<HabitLog[]> {
  await ensureDataDirectory();

  // If year not specified, use current year
  const targetYear = year || new Date().getFullYear();
  const logFile = getLogFilePath(habitId, targetYear);

  try {
    const data = await fs.readFile(logFile, 'utf-8');
    const lines = data.trim().split('\n').filter(line => line.trim());
    return lines.map(line => JSON.parse(line));
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return empty array
      return [];
    }
    throw error;
  }
}

/**
 * Load logs for a habit across all years
 */
export async function loadAllLogs(habitId: string): Promise<HabitLog[]> {
  await ensureDataDirectory();

  const files = await fs.readdir(LOGS_DIR);
  const habitLogFiles = files.filter(f => f.startsWith(`${habitId}_`) && f.endsWith('.jsonl'));

  const allLogs: HabitLog[] = [];

  for (const file of habitLogFiles) {
    try {
      const data = await fs.readFile(path.join(LOGS_DIR, file), 'utf-8');
      const lines = data.trim().split('\n').filter(line => line.trim());
      const logs = lines.map(line => JSON.parse(line));
      allLogs.push(...logs);
    } catch (error) {
      // Skip files that can't be read
      console.error(`Error reading ${file}:`, error);
    }
  }

  return allLogs;
}

/**
 * Append a log entry to JSONL file
 */
export async function appendLog(log: HabitLog): Promise<void> {
  await ensureDataDirectory();

  const logDate = new Date(log.logDate);
  const year = logDate.getFullYear();
  const logFile = getLogFilePath(log.habitId, year);

  const logLine = JSON.stringify(log) + '\n';
  await fs.appendFile(logFile, logLine, 'utf-8');
}

/**
 * Update an existing log entry in JSONL file
 * This reads all logs, updates the matching one, and rewrites the file
 */
export async function updateLog(habitId: string, logId: string, updates: Partial<HabitLog>): Promise<void> {
  await ensureDataDirectory();

  // Load all logs for this habit
  const logDate = updates.logDate ? new Date(updates.logDate) : new Date();
  const year = logDate.getFullYear();
  const logFile = getLogFilePath(habitId, year);

  try {
    const logs = await loadLogs(habitId, year);
    const logIndex = logs.findIndex(l => l.id === logId);

    if (logIndex === -1) {
      throw new Error(`Log with id ${logId} not found`);
    }

    // Update the log
    logs[logIndex] = { ...logs[logIndex], ...updates, updatedAt: new Date().toISOString() };

    // Rewrite the file
    const content = logs.map(l => JSON.stringify(l)).join('\n') + '\n';
    await fs.writeFile(logFile, content, 'utf-8');
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(`No logs found for habit ${habitId} in year ${year}`);
    }
    throw error;
  }
}

/**
 * Find a habit by ID
 */
export async function findHabitById(habitId: string): Promise<Habit | null> {
  const data = await loadHabits();
  return data.habits.find(h => h.id === habitId) || null;
}

/**
 * Update a habit
 */
export async function updateHabit(habitId: string, updates: Partial<Habit>): Promise<Habit> {
  const data = await loadHabits();
  const habitIndex = data.habits.findIndex(h => h.id === habitId);

  if (habitIndex === -1) {
    throw new Error(`Habit with id ${habitId} not found`);
  }

  data.habits[habitIndex] = {
    ...data.habits[habitIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  await saveHabits(data);
  return data.habits[habitIndex];
}

/**
 * Generate unique ID
 */
export function generateId(prefix: string = 'id'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}${random}`;
}
