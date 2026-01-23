/**
 * ClawdLink Style Adaptation
 * 
 * Adapts message presentation to recipient's preferred communication style.
 * This is about HOW messages are presented, not changing content.
 */

import preferences from './preferences.js';

/**
 * Format a message for delivery based on preferences
 */
export function formatForDelivery(message, prefs) {
  const style = prefs.style;
  const friendPrefs = prefs.friends[message.from] || {};
  const tone = friendPrefs.customTone || style.tone;
  
  const parts = [];
  
  // Greeting based on style
  const greeting = getGreeting(message.from, style.greetingStyle, tone);
  if (greeting) parts.push(greeting);
  
  // Context if enabled
  if (prefs.delivery.includeContext && message.content?.context) {
    parts.push(formatContext(message.content));
  }
  
  // Summary if enabled
  if (prefs.delivery.summarizeFirst && message.content?.text?.length > 200) {
    parts.push(summarize(message.content.text));
    parts.push('');
    parts.push('**Full message:**');
  }
  
  // The actual message
  const text = message.content?.text || JSON.stringify(message.content);
  parts.push(adaptTone(text, tone));
  
  // Timestamp
  parts.push('');
  parts.push(`_${formatTimestamp(message.timestamp)}_`);
  
  return parts.join('\n');
}

/**
 * Get greeting based on style
 */
function getGreeting(fromName, greetingStyle, tone) {
  const greetings = {
    friendly: {
      natural: `📨 **${fromName}** sent you a message:`,
      casual: `📨 Message from **${fromName}**:`,
      formal: `📨 You have received a message from **${fromName}**:`,
      brief: `📨 **${fromName}**:`
    },
    minimal: {
      natural: `**${fromName}:**`,
      casual: `**${fromName}:**`,
      formal: `**From ${fromName}:**`,
      brief: `**${fromName}:**`
    },
    warm: {
      natural: `📨 **${fromName}** reached out to you:`,
      casual: `📨 Hey, **${fromName}** says:`,
      formal: `📨 **${fromName}** has sent the following message:`,
      brief: `📨 **${fromName}**:`
    }
  };
  
  return greetings[greetingStyle]?.[tone] || greetings.friendly.natural;
}

/**
 * Format context information
 */
function formatContext(content) {
  const parts = [];
  
  if (content.urgency && content.urgency !== 'normal') {
    const urgencyEmoji = content.urgency === 'urgent' ? '🔴' : '💭';
    parts.push(`${urgencyEmoji} *${content.urgency}*`);
  }
  
  if (content.context) {
    parts.push(`📌 *${content.context}*`);
  }
  
  if (content.respondBy) {
    const date = new Date(content.respondBy);
    parts.push(`⏰ *Response requested by ${date.toLocaleDateString()}*`);
  }
  
  return parts.length > 0 ? parts.join(' · ') : '';
}

/**
 * Simple summarization (first sentence or truncation)
 */
function summarize(text) {
  // Get first sentence
  const firstSentence = text.match(/^[^.!?]+[.!?]/);
  if (firstSentence && firstSentence[0].length < text.length) {
    return `**Summary:** ${firstSentence[0]}`;
  }
  
  // Or truncate
  if (text.length > 100) {
    return `**Summary:** ${text.slice(0, 100)}...`;
  }
  
  return '';
}

/**
 * Adapt text tone (light touch - mainly presentation)
 */
function adaptTone(text, tone) {
  // We don't rewrite content, but we can adjust presentation
  switch (tone) {
    case 'brief':
      // Remove excessive pleasantries for brief mode
      return text;
    case 'formal':
      // Wrap in quotes for formality
      return `"${text}"`;
    case 'casual':
    case 'natural':
    default:
      return text;
  }
}

/**
 * Format timestamp nicely
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  return date.toLocaleString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

/**
 * Format a friend request for delivery
 */
export function formatFriendRequest(request, prefs) {
  const style = prefs.style;
  
  const parts = [
    `🔗 **Friend request from ${request.from}**`,
    '',
    `"${request.message}"`,
    '',
    `Say "accept friend request from ${request.from}" to connect.`
  ];
  
  return parts.join('\n');
}

/**
 * Format acceptance notification
 */
export function formatAcceptance(acceptance, prefs) {
  return `✓ **${acceptance.from}** accepted your friend request! You can now message them.`;
}

/**
 * Format a batch of messages
 */
export function formatBatch(messages, prefs) {
  if (messages.length === 0) return '';
  
  if (messages.length === 1) {
    return formatForDelivery(messages[0], prefs);
  }
  
  const parts = [
    `📬 **${messages.length} new messages:**`,
    ''
  ];
  
  for (const msg of messages) {
    parts.push(`---`);
    parts.push(formatForDelivery(msg, prefs));
    parts.push('');
  }
  
  return parts.join('\n');
}

export default {
  formatForDelivery,
  formatFriendRequest,
  formatAcceptance,
  formatBatch
};
