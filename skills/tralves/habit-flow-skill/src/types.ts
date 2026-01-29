/**
 * Type definitions for HabitFlow skill
 * Adapted from @habit-flow/shared/types
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Habit frequency options
 */
export enum HabitFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

/**
 * Habit category options
 */
export enum HabitCategory {
  HEALTH = 'health',
  FITNESS = 'fitness',
  PRODUCTIVITY = 'productivity',
  LEARNING = 'learning',
  SOCIAL = 'social',
  CREATIVE = 'creative',
  MINDFULNESS = 'mindfulness',
  SPIRITUALITY = 'spirituality',
  OTHER = 'other',
}

/**
 * Habit log status options
 */
export enum HabitLogStatus {
  COMPLETED = 'completed',
  PARTIAL = 'partial',
  MISSED = 'missed',
  SKIPPED = 'skipped',
}

export enum StreakType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom'
}

export enum StreakQuality {
  PERFECT = 'perfect',
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair'
}

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Custom frequency configuration for complex scheduling
 */
export interface CustomFrequencyConfig {
  days?: number[]; // 0=Sunday, 6=Saturday
  interval?: number; // every N days/weeks/months
  exceptions?: string[]; // ISO date strings for exceptions
}

/**
 * Reminder settings for habit notifications
 */
export interface ReminderSettings {
  enabled: boolean;
  times: string[]; // HH:MM format
  message?: string;
  channel?: 'last' | 'whatsapp' | 'telegram' | 'discord' | 'slack' | 'imessage'; // Delivery channel (default: last)
  to?: string; // Optional: specific recipient (E.164 for phone, chatId for Telegram, etc.)
}

/**
 * Core Habit model
 */
export interface Habit {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  targetCount: number;
  targetUnit?: string;
  customFrequencyConfig?: CustomFrequencyConfig;
  reminderSettings?: ReminderSettings;
  isActive: boolean;
  startDate?: Date | string;
  endDate?: Date | string;
  currentStreak: number;
  longestStreak: number;
  metadata?: Record<string, any>;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Core HabitLog model
 */
export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  logDate: Date | string;
  status: HabitLogStatus;
  actualCount: number;
  targetCount?: number;
  unit?: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

/**
 * Daily completion summary
 */
export interface DailyCompletion {
  date: string; // ISO date string (YYYY-MM-DD)
  actualCount: number;
  targetCount: number;
  status: HabitLogStatus;
  isCompleted: boolean;
  completionPercentage: number;
  logId: string;
}

/**
 * Streak information with forgiveness mechanism
 */
export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  perfectStreak: number;
  streakStartDate?: Date;
  lastCompletionDate?: Date;
  nextExpectedDate?: Date;
  missedDaysInStreak: number;
  isStreakActive: boolean;
  forgivenessDaysUsed: number;
  forgivenessDaysRemaining: number;
  streakType: StreakType;
  streakQuality: StreakQuality;
  milestones: any[];
  recovery?: any;
}

/**
 * Completion rate statistics
 */
export interface CompletionRateResult {
  overall: number;
  perfect: number;
  partial: number;
  missed: number;
  averageActualCount: number;
  totalDays: number;
  completedDays: number;
}

// ============================================================================
// INPUT INTERFACES
// ============================================================================

/**
 * Habit creation payload
 */
export interface CreateHabitInput {
  name: string;
  description?: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  targetCount: number;
  targetUnit?: string;
  customFrequencyConfig?: CustomFrequencyConfig;
  reminderSettings?: ReminderSettings;
  startDate?: string;
  endDate?: string;
  metadata?: Record<string, any>;
}

/**
 * Habit update payload - all fields optional
 */
export interface UpdateHabitInput {
  name?: string;
  description?: string;
  category?: HabitCategory;
  frequency?: HabitFrequency;
  targetCount?: number;
  targetUnit?: string;
  customFrequencyConfig?: CustomFrequencyConfig;
  reminderSettings?: ReminderSettings;
  isActive?: boolean;
  startDate?: Date | string;
  endDate?: Date | string;
  metadata?: Record<string, any>;
}

/**
 * Natural language habit creation from AI parsing
 */
export interface HabitCreationIntent {
  originalText: string;
  parsedName: string;
  suggestedCategory: HabitCategory;
  suggestedFrequency: HabitFrequency;
  suggestedTargetCount?: number;
  suggestedTargetUnit?: string;
  suggestedTimePreference?: TimePreference;
  suggestedSpecificTime?: string;
  confidence: number;
}

/**
 * Time preference type for type safety
 */
export type TimePreference = 'morning' | 'afternoon' | 'evening' | 'specific';

/**
 * Natural language log parsing result
 */
export interface NaturalLanguageLogIntent {
  intent: 'log';
  habitId?: string;
  habitName: string;
  dates: string[];
  status: HabitLogStatus;
  count?: number;
  notes?: string;
  confidence: number;
}

// ============================================================================
// STORAGE INTERFACES
// ============================================================================

/**
 * habits.json root structure
 */
export interface HabitsData {
  habits: Habit[];
}

/**
 * config.json structure
 */
export interface UserConfig {
  timezone: string;
  activePersona: string;
  userId: string;
  phoneNumber?: string; // Optional: E.164 format for WhatsApp delivery (e.g., +351912345678)
}

// ============================================================================
// PERSONA INTERFACES
// ============================================================================

export interface CommunicationStyle {
  tone: string;
  vocabulary: string[];
  responsePatterns: string[];
}

export interface Persona {
  id: string;
  name: string;
  avatar?: string;
  primaryColor: string;
  description: string;
  tagline: string;
  communicationStyle: CommunicationStyle;
}
