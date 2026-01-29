#!/usr/bin/env node
/**
 * Proactive Coaching Script
 * Generates and sends proactive coaching messages based on habit patterns
 */

import { Command } from 'commander';
import { loadHabits, loadLogs, loadConfig } from '../src/storage.js';
import { assessRisk, detectMilestone, detectPatterns } from '../src/pattern-analyzer.js';
import {
  generateMilestoneMessage,
  generateRiskWarning,
  generateWeeklyCheckin,
  generateInsightMessage,
  CoachingMessage,
  WeeklyStats
} from '../src/coaching-engine.js';
import { calculateStreak } from '../src/streak-calculation.js';
import { getLastLogPerDay } from '../src/daily-completion.js';

const program = new Command();

program
  .name('proactive_coaching')
  .description('Generate proactive coaching messages for habits')
  .option('--check-milestones', 'Check for milestone celebrations')
  .option('--check-risks', 'Check for streak risk warnings')
  .option('--weekly-checkin', 'Generate weekly check-in messages')
  .option('--detect-insights', 'Detect and share pattern insights')
  .option('--habit-id <id>', 'Run for specific habit only')
  .option('--send', 'Actually send messages (default: dry run)')
  .option('--format <type>', 'Output format: text or json (default: text)', 'text')
  .action(async (options) => {
    try {
      const data = await loadHabits();
      const config = await loadConfig();

      // Filter habits
      let habits = data.habits.filter(h => h.isActive);
      if (options.habitId) {
        habits = habits.filter(h => h.id === options.habitId);
      }

      if (habits.length === 0) {
        console.log('No active habits found.');
        return;
      }

      const messages: CoachingMessage[] = [];

      for (const habit of habits) {
        const year = new Date().getFullYear();
        const logs = await loadLogs(habit.id, year);

        // Update streak info
        const streakInfo = calculateStreak(habit, logs);
        habit.currentStreak = streakInfo.currentStreak;
        habit.longestStreak = streakInfo.longestStreak;

        // Check milestones
        if (options.checkMilestones || !hasSpecificCheck(options)) {
          const milestone = detectMilestone(habit);
          if (milestone) {
            const message = await generateMilestoneMessage(habit, milestone);
            messages.push(message);
          }
        }

        // Check risks
        if (options.checkRisks || !hasSpecificCheck(options)) {
          const risk = assessRisk(habit, logs);
          if (risk.riskScore >= 60) {
            const message = await generateRiskWarning(habit, risk);
            if (message) messages.push(message);
          }
        }

        // Weekly check-in
        if (options.weeklyCheckin) {
          const weeklyStats = calculateWeeklyStats(logs);
          const message = await generateWeeklyCheckin(habit, weeklyStats);
          messages.push(message);
        }

        // Detect insights
        if (options.detectInsights || !hasSpecificCheck(options)) {
          const insights = detectPatterns(habit, logs);
          for (const insight of insights) {
            const message = await generateInsightMessage(habit, insight);
            messages.push(message);
          }
        }
      }

      // Output messages
      if (options.format === 'json') {
        // JSON format for agent parsing
        const output = {
          success: true,
          messageCount: messages.length,
          messages: messages.map(m => ({
            subject: m.subject,
            body: m.body,
            type: m.messageType,
            priority: m.priority,
            habitId: m.habitId,
            attachments: m.attachments ? m.attachments.filter(a => a) : []
          }))
        };
        console.log(JSON.stringify(output, null, 2));
      } else if (options.send) {
        // When --send is used, output in a format that clawdbot's isolated session can deliver
        console.log('📤 COACHING MESSAGES FOR DELIVERY\n');

        for (const message of messages) {
          console.log(`\n${'='.repeat(60)}`);
          console.log(`${message.subject}\n`);
          console.log(message.body);

          // Note attachments for the agent to send
          if (message.attachments && message.attachments.length > 0) {
            const validAttachments = message.attachments.filter(a => a);
            if (validAttachments.length > 0) {
              console.log(`\n📎 Attachments to send: ${validAttachments.join(', ')}`);
              console.log('(Agent: Use the Read tool to display these images)');
            }
          }
          console.log(`${'='.repeat(60)}`);
        }

        console.log(`\n✅ Generated ${messages.length} coaching message(s)`);
        console.log('When running in clawdbot cron with --deliver, the above will be sent automatically.');
      } else {
        console.log('🔍 DRY RUN - Messages that would be sent:\n');
        for (const message of messages) {
          console.log(`\n${'='.repeat(60)}`);
          console.log(`📬 ${message.subject}`);
          console.log(`📊 Type: ${message.messageType} | Priority: ${message.priority}`);
          console.log(`\n${message.body}`);
          if (message.attachments && message.attachments.length > 0) {
            const validAttachments = message.attachments.filter(a => a);
            if (validAttachments.length > 0) {
              console.log(`\n📎 Attachments: ${validAttachments.join(', ')}`);
            }
          }
        }
        console.log(`\n${'='.repeat(60)}`);
        console.log(`\nTotal messages: ${messages.length}`);
        console.log('(Use --send flag to actually deliver messages)');
      }

    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

program.parse();

// Helper functions

function hasSpecificCheck(options: any): boolean {
  return options.checkMilestones || options.checkRisks || options.weeklyCheckin || options.detectInsights;
}

function calculateWeeklyStats(logs: any[]): WeeklyStats {
  const dailyCompletions = getLastLogPerDay(logs);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const thisWeek = dailyCompletions.filter(d => new Date(d.date) >= weekAgo);
  const lastWeek = dailyCompletions.filter(d => {
    const date = new Date(d.date);
    return date >= twoWeeksAgo && date < weekAgo;
  });

  const thisWeekCompleted = thisWeek.filter(d => d.isCompleted).length;
  const lastWeekCompleted = lastWeek.filter(d => d.isCompleted).length;

  const completionRate = Math.round((thisWeekCompleted / 7) * 100);
  const lastWeekRate = lastWeek.length > 0 ? Math.round((lastWeekCompleted / lastWeek.length) * 100) : 0;

  return {
    daysCompleted: thisWeekCompleted,
    completionRate,
    trend: completionRate - lastWeekRate
  };
}

// Message delivery is handled by clawdbot's isolated session with --deliver flag
// The script outputs the message content, and clawdbot's agent automatically sends it
// to the user's last active channel when the cron job runs
