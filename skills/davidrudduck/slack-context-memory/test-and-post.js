#!/usr/bin/env node
/**
 * Test pipeline: detect conversations, summarize, and post to Slack
 */

import pg from 'pg';
import Anthropic from '@anthropic-ai/sdk';

const { Client } = pg;

const DB_URL = process.env.SLACK_DB_URL;

const EMBEDDING_API = process.env.EMBEDDING_API_URL;
const EMBEDDING_API_KEY = process.env.EMBEDDING_API_KEY || 'dummy';

const anthropic = new Anthropic();

const TIME_GAP_THRESHOLD_MS = 30 * 60 * 1000;
const MIN_MESSAGES = 3;
const MAX_MESSAGES = 100;

async function detectConversations(channelId) {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  try {
    const result = await client.query(`
      SELECT ts, user_id, text, thread_ts, timestamp
      FROM slack_messages
      WHERE channel_id = $1
      ORDER BY timestamp ASC
    `, [channelId]);

    if (result.rows.length < MIN_MESSAGES) {
      return [];
    }

    const conversations = [];
    let current = null;
    let lastTime = null;

    for (const msg of result.rows) {
      const msgTime = new Date(msg.timestamp);
      const gap = lastTime ? msgTime - lastTime : 0;

      const shouldStart = !current || 
        gap > TIME_GAP_THRESHOLD_MS || 
        current.messages.length >= MAX_MESSAGES ||
        (msg.thread_ts && msg.thread_ts !== current.thread_ts);

      if (shouldStart) {
        if (current && current.messages.length >= MIN_MESSAGES) {
          conversations.push(current);
        }
        current = {
          channel_id: channelId,
          thread_ts: msg.thread_ts || null,
          start_ts: msgTime,
          end_ts: msgTime,
          messages: [],
          participants: new Set(),
          message_ids: []
        };
      }

      current.messages.push(msg);
      current.message_ids.push(msg.ts);
      current.participants.add(msg.user_id);
      current.end_ts = msgTime;
      lastTime = msgTime;
    }

    if (current && current.messages.length >= MIN_MESSAGES) {
      conversations.push(current);
    }

    conversations.forEach(c => {
      c.participants = Array.from(c.participants);
      c.message_count = c.messages.length;
    });

    return conversations;
  } finally {
    await client.end();
  }
}

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
  "outcome": "resolved|ongoing|needs-follow-up|question|discussion"
}

Return ONLY valid JSON.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const jsonText = response.content[0].text.trim();
    // Extract JSON if wrapped in markdown
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(jsonText);
  } catch (error) {
    console.error('Summarization error:', error.message);
    return {
      tldr: `Discussion with ${conversation.participants.length} participants`,
      full_summary: `Conversation spanning ${conversation.message_count} messages`,
      key_decisions: [],
      topics: [],
      outcome: 'unknown'
    };
  }
}

async function generateEmbedding(text) {
  try {
    const response = await fetch(EMBEDDING_API, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${EMBEDDING_API_KEY}`
      },
      body: JSON.stringify({ model: 'BAAI/bge-m3', input: text })
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.data[0].embedding;
  } catch {
    return null;
  }
}

async function storeSummary(conversation, summary) {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  try {
    const embeddingText = `${summary.tldr}\n\n${summary.full_summary}`;
    const embedding = await generateEmbedding(embeddingText);
    const embeddingStr = embedding ? `[${embedding.join(',')}]` : null;

    await client.query(`
      INSERT INTO conversation_summaries (
        channel_id, thread_ts, start_ts, end_ts, message_count,
        tldr, participants, key_decisions, topics, outcome,
        full_summary, embedding, message_ids, first_message_ts, last_message_ts,
        confidence_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (channel_id, thread_ts, start_ts) DO UPDATE SET
        tldr = EXCLUDED.tldr,
        full_summary = EXCLUDED.full_summary,
        key_decisions = EXCLUDED.key_decisions,
        topics = EXCLUDED.topics,
        outcome = EXCLUDED.outcome,
        embedding = EXCLUDED.embedding,
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
      embeddingStr,
      conversation.message_ids,
      conversation.messages[0].ts,
      conversation.messages[conversation.messages.length - 1].ts,
      0.8
    ]);
  } finally {
    await client.end();
  }
}

function formatSummaryForSlack(channelName, conversations, summaries) {
  let output = `📊 **Context Memory Test: #${channelName}**\n\n`;
  output += `Found **${conversations.length}** conversation(s) to summarize:\n\n`;

  for (let i = 0; i < summaries.length; i++) {
    const conv = conversations[i];
    const sum = summaries[i];
    const date = conv.start_ts.toLocaleDateString();
    const time = conv.start_ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    output += `---\n`;
    output += `**Conversation ${i + 1}** (${date} ${time}, ${conv.message_count} messages)\n\n`;
    output += `**TL;DR:** ${sum.tldr}\n\n`;
    
    if (sum.topics && sum.topics.length > 0) {
      output += `**Topics:** ${sum.topics.join(', ')}\n\n`;
    }
    
    if (sum.key_decisions && sum.key_decisions.length > 0) {
      output += `**Key decisions:**\n\n`;
      for (const decision of sum.key_decisions) {
        output += `• ${decision}\n`;
      }
      output += '\n';
    }
    
    output += `**Outcome:** ${sum.outcome}\n\n`;
  }

  output += `---\n✅ Summaries stored in database with embeddings for semantic search.`;
  return output;
}

// Main
const channelId = process.argv[2];
if (!channelId) {
  console.error('Usage: node test-and-post.js <channel_id>');
  process.exit(1);
}

console.log(`\n🔍 Processing channel: ${channelId}`);

// Get channel name
const client = new Client({ connectionString: DB_URL });
await client.connect();
const channelResult = await client.query('SELECT name FROM slack_channels WHERE id = $1', [channelId]);
const channelName = channelResult.rows[0]?.name || channelId;
await client.end();

console.log(`📌 Channel: #${channelName}`);

// Detect conversations
console.log('🔄 Detecting conversations...');
const conversations = await detectConversations(channelId);
console.log(`   Found ${conversations.length} conversation(s)`);

if (conversations.length === 0) {
  console.log('❌ No conversations to summarize');
  process.exit(0);
}

// Summarize each
console.log('🧠 Generating summaries...');
const summaries = [];
for (let i = 0; i < conversations.length; i++) {
  console.log(`   Summarizing ${i + 1}/${conversations.length}...`);
  const summary = await summarizeConversation(conversations[i]);
  summaries.push(summary);
  
  // Store in DB
  await storeSummary(conversations[i], summary);
  console.log(`   ✅ Stored: ${summary.tldr.substring(0, 60)}...`);
}

// Format for Slack
const slackMessage = formatSummaryForSlack(channelName, conversations, summaries);
console.log('\n📝 Slack message:\n');
console.log(slackMessage);

// Output the formatted message for posting
console.log('\n---JSON_OUTPUT---');
console.log(JSON.stringify({
  channelId,
  channelName,
  conversationCount: conversations.length,
  message: slackMessage
}));
