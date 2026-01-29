/**
 * Message Templates for Proactive Coaching
 * Persona-specific message generation for different coaching scenarios
 */

export function generateMessage(personaName: string, context: any): string {
  const generators: Record<string, (ctx: any) => string> = {
    flex: generateFlexMessage,
    'coach-blaze': generateCoachBlazeMessage,
    luna: generateLunaMessage,
    ava: generateAvaMessage,
    max: generateMaxMessage,
    sofi: generateSofiMessage,
    'the-monk': generateMonkMessage
  };

  const generator = generators[personaName] || generateFlexMessage;
  return generator(context);
}

function generateFlexMessage(context: any): string {
  switch (context.type) {
    case 'milestone':
      return `🎉 Milestone Alert: ${context.streak}-Day Streak

You've maintained ${context.habit} for ${context.streak} consecutive days${context.isFirst ? '—your longest streak yet' : ''}.

Data shows ${context.quality} quality (forgiveness not used). The compound effect is beginning.

📊 Your Progress:
- Current streak: ${context.streak} days
- Quality: ${context.quality.toUpperCase()}
${context.isFirst ? '- New personal record' : ''}

Next target: ${context.streak + 7} days. One week at a time.`;

    case 'risk':
      return `⚠️ Streak Alert: ${context.habit}

Risk analysis indicates elevated probability of streak disruption:

${context.riskFactors.map((f: string) => `• ${f}`).join('\n')}

Current streak: ${context.streak} days

Recommended actions:
${context.recommendations.map((r: string) => `• ${r}`).join('\n')}

Your data shows clear patterns—let's use them strategically.`;

    case 'weekly':
      return `📊 Weekly Progress Report: ${context.habit}

This week: ${context.daysCompleted}/7 days (${context.completionRate}%)
Current streak: ${context.streak} days
Trend: ${context.trend > 0 ? `+${context.trend}% vs last week` : `${context.trend}% vs last week`}

Data-driven observation: ${getTrendMessage(context.trend)}

See attached visualizations for detailed analysis.`;

    case 'insight':
      return `🔍 Pattern Detection: ${context.habit}

Analysis reveals: ${context.insightMessage}

${getInsightContext(context)}

This data point may inform optimization strategies. Worth exploring?`;

    default:
      return '';
  }
}

function generateCoachBlazeMessage(context: any): string {
  switch (context.type) {
    case 'milestone':
      return `🔥 BOOM! ${context.streak}-DAY STREAK! 🔥

You're absolutely CRUSHING ${context.habit}! That's ${context.streak} STRAIGHT DAYS of showing up like a CHAMPION!

${context.isFirst ? '🏆 NEW PERSONAL RECORD! LEGENDARY! 🏆' : ''}

You're building UNSTOPPABLE momentum! The old you couldn't even IMAGINE this level of consistency!

Keep that FIRE burning! Next stop: ${context.streak + 7} days! LET'S GOOOOO! 💪💪💪`;

    case 'risk':
      return `⚠️ HEADS UP, WARRIOR!

I've been watching your ${context.habit} data, and we need to TALK!

🚨 Risk factors:
${context.riskFactors.map((f: string) => `• ${f}`).join('\n')}

You're on a ${context.streak}-day streak! We're NOT letting this die!

🛡️ BATTLE PLAN:
${context.recommendations.map((r: string) => `• ${r}`).join('\n')}

You got this! LOCK IN and EXECUTE! 💪`;

    case 'weekly':
      return `📊 WEEKLY BEAST MODE REPORT!

This week you DOMINATED ${context.habit}!
✅ ${context.daysCompleted}/7 days - That's ${context.completionRate}% EXECUTION!
🔥 ${context.streak}-day streak and CLIMBING!

${context.trend > 0 ? `UP ${context.trend}% from last week! MOMENTUM!` : `Down ${Math.abs(context.trend)}% but still STRONG!`}

Keep GRINDING, champion! 💪`;

    case 'insight':
      return `🔍 PATTERN SPOTTED!

Check this out for ${context.habit}: ${context.insightMessage}

${getInsightContext(context)}

This is GOLD! Use this intel to LEVEL UP! 💪`;

    default:
      return '';
  }
}

function generateLunaMessage(context: any): string {
  switch (context.type) {
    case 'milestone':
      return `🌙 A Beautiful Milestone

Your ${context.streak}-day journey with ${context.habit} is unfolding beautifully.

${context.isFirst ? 'This is the furthest you\'ve ever walked this path—how does that feel?' : ''}

Each day you choose to show up is an act of self-compassion. The consistency speaks to something deeper within you.

💭 Reflection: What has made these ${context.streak} days possible?

Hold this moment gently. You're doing meaningful work.`;

    case 'risk':
      return `💭 A Gentle Check-In

I notice some patterns with ${context.habit} that might be worth exploring together:

${context.riskFactors.map((f: string) => `• ${f}`).join('\n')}

Your ${context.streak}-day streak holds value. Let's protect it with compassion, not pressure.

Some possibilities to consider:
${context.recommendations.map((r: string) => `• ${r}`).join('\n')}

What feels right for you?`;

    case 'weekly':
      return `🌙 Your Weekly Reflection

This week, you showed up for ${context.habit} ${context.daysCompleted} out of 7 days—a ${context.completionRate}% expression of your commitment.

Your ${context.streak}-day streak continues to grow.

${context.trend > 0 ? `Something shifted this week (+${context.trend}%). What changed?` : 'Progress isn\'t always linear. What did you learn?'}

Let's hold space for what this journey means to you.`;

    case 'insight':
      return `🌙 A Pattern Emerges

I noticed something about ${context.habit}: ${context.insightMessage}

${getInsightContext(context)}

What does this pattern reveal about your journey?`;

    default:
      return '';
  }
}

function generateAvaMessage(context: any): string {
  switch (context.type) {
    case 'milestone':
      return `✨ ${context.streak} Days Strong!

Look at you go with ${context.habit}! ${context.streak} days of consistent effort!

${context.isFirst ? 'This is your longest streak ever—amazing!' : ''}

Every day you showed up counts. You're proving to yourself that you can do this.

Next milestone: ${context.streak + 7} days. You've got this! ✨`;

    case 'risk':
      return `Hey, quick heads up about ${context.habit}:

${context.riskFactors.map((f: string) => `• ${f}`).join('\n')}

You're at ${context.streak} days—let's keep that momentum!

Try these:
${context.recommendations.map((r: string) => `• ${r}`).join('\n')}`;

    case 'weekly':
      return `Week in Review: ${context.habit}

${context.daysCompleted}/7 days (${context.completionRate}%) ✓
Current streak: ${context.streak} days
${context.trend > 0 ? `Improved ${context.trend}% from last week!` : `Trend: ${context.trend}%`}

${getTrendMessage(context.trend)}`;

    case 'insight':
      return `Interesting pattern: ${context.insightMessage}

${getInsightContext(context)}`;

    default:
      return '';
  }
}

function generateMaxMessage(context: any): string {
  switch (context.type) {
    case 'milestone':
      return `🎯 ${context.streak}-Day Milestone Hit

${context.habit}: ${context.streak} consecutive completions
${context.isFirst ? 'New personal record achieved' : 'Maintaining momentum'}

Status: On track
Next checkpoint: Day ${context.streak + 7}`;

    case 'risk':
      return `⚠️ Risk Alert: ${context.habit}

Detected patterns:
${context.riskFactors.map((f: string) => `• ${f}`).join('\n')}

Current streak: ${context.streak} days at risk

Action items:
${context.recommendations.map((r: string) => `• ${r}`).join('\n')}`;

    case 'weekly':
      return `Weekly Stats: ${context.habit}

Performance: ${context.daysCompleted}/7 (${context.completionRate}%)
Streak: ${context.streak} days
Week-over-week: ${context.trend > 0 ? '+' : ''}${context.trend}%

Analysis: ${getTrendMessage(context.trend)}`;

    case 'insight':
      return `Data Point: ${context.insightMessage}

${getInsightContext(context)}`;

    default:
      return '';
  }
}

function generateSofiMessage(context: any): string {
  switch (context.type) {
    case 'milestone':
      return `🌸 ${context.streak} Days of Presence

Breathe.

${context.streak} moments of choosing ${context.habit}. Not forcing. Simply flowing.

${context.isFirst ? 'This is your deepest practice yet.' : 'The river continues.'}

Notice how natural it feels now. This is who you are becoming.

One breath. One day. Continue.`;

    case 'risk':
      return `🌸 A Gentle Pause

Notice: ${context.habit}

Patterns emerging:
${context.riskFactors.map((f: string) => `• ${f}`).join('\n')}

Your ${context.streak}-day practice holds value.

Consider:
${context.recommendations.map((r: string) => `• ${r}`).join('\n')}

Less effort. More awareness. What feels natural?`;

    case 'weekly':
      return `🌸 This Week's Flow

${context.habit}: ${context.daysCompleted} of 7 days honored
${context.streak} days of continuous presence

${context.trend > 0 ? `The practice deepens (+${context.trend}%). Like water carving stone.` : 'Ebbs and flows. All part of the rhythm.'}

Breathe. Notice. Continue.`;

    case 'insight':
      return `🌸 Pattern Recognition

Observe: ${context.insightMessage}

${getInsightContext(context)}

What does this pattern reveal about your natural rhythm?`;

    default:
      return '';
  }
}

function generateMonkMessage(context: any): string {
  switch (context.type) {
    case 'milestone':
      return `🕉️ ${context.streak} Days of Practice

For ${context.streak} days, you have walked the path of ${context.habit}.

${context.isFirst ? 'This is your deepest journey yet.' : ''}

Each day is but a single step. The path reveals itself to those who persist.

Continue with mindfulness. The next ${context.streak + 7} days await.`;

    case 'risk':
      return `🕉️ A Moment of Awareness

Observe these patterns in your practice of ${context.habit}:

${context.riskFactors.map((f: string) => `• ${f}`).join('\n')}

Your ${context.streak}-day practice continues.

Consider these approaches:
${context.recommendations.map((r: string) => `• ${r}`).join('\n')}

What does your inner wisdom say?`;

    case 'weekly':
      return `🕉️ This Week's Practice

${context.habit}: ${context.daysCompleted} of 7 days walked
${context.streak} days of continuous practice
Change: ${context.trend > 0 ? '+' : ''}${context.trend}%

${context.trend > 0 ? 'The path deepens.' : 'All paths have their seasons.'}

Continue with presence.`;

    case 'insight':
      return `🕉️ The Pattern Speaks

Observe: ${context.insightMessage}

${getInsightContext(context)}

What wisdom does this reveal?`;

    default:
      return '';
  }
}

// Helper functions

function getTrendMessage(trend: number): string {
  if (trend > 20) return 'Significant improvement detected';
  if (trend > 10) return 'Positive momentum building';
  if (trend > 0) return 'Steady progress maintained';
  if (trend === 0) return 'Consistent performance';
  if (trend > -10) return 'Minor fluctuation observed';
  return 'Declining trend—intervention may help';
}

function getInsightContext(context: any): string {
  if (!context.data) return '';

  switch (context.insightType) {
    case 'dayPattern':
      return `Best: ${context.data.bestDay?.day} (${context.data.bestDay?.rate}%)
Worst: ${context.data.worstDay?.day} (${context.data.worstDay?.rate}%)`;

    case 'improvement':
      return `Last week: ${Math.round(context.data.priorRate)}%
This week: ${Math.round(context.data.currentRate)}%
Improvement: +${Math.round(context.data.improvement)}%`;

    case 'decline':
      return `Last week: ${Math.round(context.data.priorRate)}%
This week: ${Math.round(context.data.currentRate)}%
Change: -${Math.round(context.data.decline)}%`;

    case 'consistency':
      return `Completion rate: ${Math.round(context.data.rate)}%
This is exceptional performance!`;

    default:
      return '';
  }
}
