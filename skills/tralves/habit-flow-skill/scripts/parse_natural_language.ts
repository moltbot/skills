#!/usr/bin/env node
/**
 * Parse Natural Language Script
 * Convert natural language to structured logging commands
 */

import { Command } from 'commander';
import { loadHabits } from '../src/storage.js';
import { HabitLogStatus, NaturalLanguageLogIntent } from '../src/types.js';
import * as chrono from 'chrono-node';
import { compareTwoStrings } from 'string-similarity';

const program = new Command();

program
  .name('parse_natural_language')
  .description('Parse natural language habit logging')
  .requiredOption('--text <text>', 'Natural language text to parse')
  .action(async (options) => {
    try {
      const data = await loadHabits();
      const activeHabits = data.habits.filter(h => h.isActive);

      if (activeHabits.length === 0) {
        throw new Error('No active habits found');
      }

      const text = options.text.toLowerCase();

      // Extract habit name
      const { habitId, habitName, confidence: habitConfidence } = extractHabitName(text, activeHabits);

      // Parse dates
      const dates = parseDates(text);

      // Detect status
      const status = detectStatus(text);

      // Extract count if present
      const count = extractCount(text);

      // Calculate overall confidence
      const confidence = habitConfidence;

      const result: NaturalLanguageLogIntent = {
        intent: 'log',
        habitId,
        habitName,
        dates,
        status,
        count,
        confidence
      };

      console.log(JSON.stringify({
        success: true,
        ...result
      }, null, 2));
    } catch (error: any) {
      console.error(JSON.stringify({
        success: false,
        error: error.message
      }, null, 2));
      process.exit(1);
    }
  });

function extractHabitName(text: string, habits: any[]): { habitId: string | undefined, habitName: string, confidence: number } {
  let bestMatch = { habitId: undefined as string | undefined, habitName: '', confidence: 0 };

  for (const habit of habits) {
    const habitNameLower = habit.name.toLowerCase();
    const similarity = compareTwoStrings(text, habitNameLower);

    // Also check if habit name is contained in text
    const containsHabitName = text.includes(habitNameLower);
    const finalScore = containsHabitName ? Math.max(similarity, 0.7) : similarity;

    if (finalScore > bestMatch.confidence) {
      bestMatch = {
        habitId: habit.id,
        habitName: habit.name,
        confidence: finalScore
      };
    }

    // Check individual words
    const habitWords = habitNameLower.split(' ');
    for (const word of habitWords) {
      if (word.length > 3 && text.includes(word)) {
        const wordScore = 0.6 + (similarity * 0.3);
        if (wordScore > bestMatch.confidence) {
          bestMatch = {
            habitId: habit.id,
            habitName: habit.name,
            confidence: wordScore
          };
        }
      }
    }
  }

  return bestMatch;
}

function parseDates(text: string): string[] {
  const now = new Date();
  const dates: string[] = [];

  // Use chrono-node for natural language date parsing
  const parsedDates = chrono.parse(text);

  if (parsedDates.length > 0) {
    for (const parsed of parsedDates) {
      const date = parsed.start.date();
      dates.push(date.toISOString().split('T')[0]);
    }
  } else {
    // Default to today if no date found
    dates.push(now.toISOString().split('T')[0]);
  }

  return dates;
}

function detectStatus(text: string): HabitLogStatus {
  const missedKeywords = ['forgot', 'missed', 'didn\'t', 'did not', 'failed'];
  const skippedKeywords = ['skipped', 'skip', 'vacation', 'rest day'];
  const partialKeywords = ['partially', 'some', 'a bit'];

  for (const keyword of missedKeywords) {
    if (text.includes(keyword)) {
      return HabitLogStatus.MISSED;
    }
  }

  for (const keyword of skippedKeywords) {
    if (text.includes(keyword)) {
      return HabitLogStatus.SKIPPED;
    }
  }

  for (const keyword of partialKeywords) {
    if (text.includes(keyword)) {
      return HabitLogStatus.PARTIAL;
    }
  }

  // Default to completed
  return HabitLogStatus.COMPLETED;
}

function extractCount(text: string): number | undefined {
  // Look for numbers in the text
  const numberMatch = text.match(/\b(\d+)\b/);
  if (numberMatch) {
    return parseInt(numberMatch[1], 10);
  }
  return undefined;
}

program.parse();
