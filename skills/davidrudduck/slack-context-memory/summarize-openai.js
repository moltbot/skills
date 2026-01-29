#!/usr/bin/env node
/**
 * Summarize Slack conversations using OpenAI GPT-5
 * Alternative to Claude for autonomous summarization
 */

import pg from 'pg';
import OpenAI from 'openai';

const { Client } = pg;

const DB_URL = process.env.SLACK_DB_URL;

const MODEL = process.env.SUMMARIZE_MODEL || 'gpt-5.1';

// OpenAI client - will use OPENAI_API_KEY from environment
const openai = new OpenAI();

async function summarizeConversation(conversation) {
  const messagesText = conversation.messages
    .slice(0, 50) // Limit for context
    .map(msg => `[${msg.user_id}]: ${msg.text}`)
    .join('\n');

  const prompt = `Analyze this Slack conversation and provide a structured summary.

Conversation (${conversation.message_count} messages, showing first 50):
${messagesText}

Generate a JSON response with:
{
  "tldr": "1-2 sentence ultra-brief summary",
  "full_summary": "Detailed 2-3 paragraph summary with key points",
  "key_decisions": ["decision 1", ...],
  "topics": ["topic1", "topic2", ...],
  "outcome": "resolved|ongoing|needs-follow-up|question|discussion",
  "confidence_score": 0.0-1.0
}

Return ONLY valid JSON, no markdown.`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const jsonText = response.choices[0].message.content.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error('Summarization error:', error.message);
    return {
      tldr: `Discussion with ${conversation.participants.length} participants`,
      full_summary: `Conversation spanning ${conversation.message_count} messages`,
      key_decisions: [],
      topics: [],
      outcome: 'unknown',
      confidence_score: 0.3
    };
  }
}

async function storeSummary(conversation, summary) {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  try {
    await client.query(`
      INSERT INTO conversation_summaries (
        channel_id, thread_ts, start_ts, end_ts, message_count,
        tldr, participants, key_decisions, topics, outcome,
        full_summary, message_ids, first_message_ts, last_message_ts,
        confidence_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (channel_id, thread_ts, start_ts) DO UPDATE SET
        tldr = EXCLUDED.tldr,
        full_summary = EXCLUDED.full_summary,
        key_decisions = EXCLUDED.key_decisions,
        topics = EXCLUDED.topics,
        outcome = EXCLUDED.outcome,
        confidence_score = EXCLUDED.confidence_score,
        updated_at = NOW()
    `, [
      conversation.channel_id,
      conversation.thread_ts,
      conversation.start_ts,
      conversation.end_ts,
      conversation.message_count,
      summary.tldr,
      conversation.participants,
      summary.key_decisions || [],
      summary.topics || [],
      summary.outcome,
      summary.full_summary,
      conversation.message_ids,
      conversation.messages[0].ts,
      conversation.messages[conversation.messages.length - 1].ts,
      summary.confidence_score || 0.8
    ]);

    console.log(`✅ Stored: ${summary.tldr.substring(0, 60)}...`);
  } finally {
    await client.end();
  }
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(`Using model: ${MODEL}`);
  
  // Read conversations from stdin
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => input += chunk);
  process.stdin.on('end', async () => {
    try {
      const conversations = JSON.parse(input);
      console.log(`Processing ${conversations.length} conversations...`);
      
      for (const conv of conversations) {
        console.log(`\nSummarizing: ${conv.channel_id} (${conv.message_count} messages)`);
        const summary = await summarizeConversation(conv);
        await storeSummary(conv, summary);
      }
      
      console.log(`\n✅ Done!`);
      process.exit(0);
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });
}

export { summarizeConversation, storeSummary };
