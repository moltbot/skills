export interface VisualizationConfig {
  width: number;
  height: number;
  theme: 'light' | 'dark';
  dateRange?: { start: Date; end: Date };
}

export interface HabitStreakData {
  habitId: string;
  habitName: string;
  currentStreak: number;
  longestStreak: number;
  streakQuality: string;
  forgivenessDaysUsed: number;
}

export interface DailyCompletionData {
  date: string; // YYYY-MM-DD
  status: 'completed' | 'partial' | 'missed' | 'skipped';
  completionPercentage: number;
}

export interface WeeklyTrendData {
  weekStart: string;
  completionRate: number;
}

export interface MultiHabitData {
  id: string;
  name: string;
  category: string;
  currentStreak: number;
  streakQuality: string;
}
