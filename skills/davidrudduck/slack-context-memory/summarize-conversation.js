#!/usr/bin/env node
/**
 * Summarize Slack conversations using LLM
 * Generates structured summaries with embeddings for semantic search
 */

import pg from 'pg';
import Anthropic from '@anthropic-ai/sdk';

const { Client } = pg;

const DB_URL = process.env.SLACK_DB_URL;

const EMBEDDING_API = process.env.EMBEDDING_API_URL;
const EMBEDDING_API_KEY = process.env.EMBEDDING_API_KEY || 'dummy';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

async function generateEmbedding(text) {
  const response = await fetch(EMBEDDING_API, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${EMBEDDING_API_KEY}`
    },
    body: JSON.stringify({
      model: 'BAAI/bge-m3',
      input: text
    })
  });

  if (!response.ok) {
    throw new Error(`Embedding API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function summarizeConversation(conversation) {
  // Build context from messages
  const messagesText = conversation.messages
    .map(msg => `[${msg.user_id}]: ${msg.text}`)
    .join('\n');

  const prompt = `Analyze this Slack conversation and provide a structured summary.

Conversation (${conversation.message_count} messages):
${messagesText}

Generate a JSON response with:
{
  "tldr": "1-2 sentence ultra-brief summary",
  "full_summary": "Detailed 2-3 paragraph summary with key points and context",
  "key_decisions": ["decision 1", "decision 2", ...],
  "topics": ["topic1", "topic2", ...],
  "outcome": "resolved|ongoing|needs-follow-up|question|discussion",
  "confidence_score": 0.0-1.0
}

Guidelines:
- tldr should be scannable and capture the essence
- full_summary should preserve important details and context
- key_decisions should capture concrete outcomes or agreements
- topics should be 2-4 word themes (e.g. "email integration", "database schema")
- outcome should reflect conversation status
- confidence_score: how well-defined/complete the conversation is

Return ONLY valid JSON, no markdown formatting.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const jsonText = response.content[0].text.trim();
    const summary = JSON.parse(jsonText);

    // Generate embedding for semantic search (tldr + full_summary)
    const embeddingText = `${summary.tldr}\n\n${summary.full_summary}`;
    const embedding = await generateEmbedding(embeddingText);

    return {
      ...summary,
      embedding,
      participants: conversation.participants,
      message_ids: conversation.message_ids,
      first_message_ts: conversation.messages[0].ts,
      last_message_ts: conversation.messages[conversation.messages.length - 1].ts
    };

  } catch (error) {
    console.error(`Failed to summarize conversation:`, error);
    
    // Fallback: simple heuristic summary
    return {
      tldr: `Discussion in ${conversation.channel_id} with ${conversation.participants.length} participants`,
      full_summary: `Conversation spanning ${conversation.message_count} messages from ${conversation.start_ts} to ${conversation.end_ts}`,
      key_decisions: [],
      topics: [],
      outcome: 'unknown',
      confidence_score: 0.3,
      embedding: null,
      participants: conversation.participants,
      message_ids: conversation.message_ids,
      first_message_ts: conversation.messages[0].ts,
      last_message_ts: conversation.messages[conversation.messages.length - 1].ts
    };
  }
}

async function storeSummary(conversation, summary) {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  try {
    const embeddingStr = summary.embedding 
      ? `[${summary.embedding.join(',')}]`
      : null;

    const query = `
      INSERT INTO conversation_summaries (
        channel_id,
        thread_ts,
        start_ts,
        end_ts,
        message_count,
        tldr,
        participants,
        key_decisions,
        topics,
        outcome,
        full_summary,
        embedding,
        message_ids,
        first_message_ts,
        last_message_ts,
        confidence_score
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      )
      ON CONFLICT (channel_id, thread_ts, start_ts) 
      DO UPDATE SET
        end_ts = EXCLUDED.end_ts,
        message_count = EXCLUDED.message_count,
        tldr = EXCLUDED.tldr,
        participants = EXCLUDED.participants,
        key_decisions = EXCLUDED.key_decisions,
        topics = EXCLUDED.topics,
        outcome = EXCLUDED.outcome,
        full_summary = EXCLUDED.full_summary,
        embedding = EXCLUDED.embedding,
        message_ids = EXCLUDED.message_ids,
        last_message_ts = EXCLUDED.last_message_ts,
        confidence_score = EXCLUDED.confidence_score,
        updated_at = NOW()
      RETURNING id
    `;

    const result = await client.query(query, [
      conversation.channel_id,
      conversation.thread_ts,
      conversation.start_ts,
      conversation.end_ts,
      conversation.message_count,
      summary.tldr,
      summary.participants,
      summary.key_decisions,
      summary.topics,
      summary.outcome,
      summary.full_summary,
      embeddingStr,
      summary.message_ids,
      summary.first_message_ts,
      summary.last_message_ts,
      summary.confidence_score
    ]);

    console.log(`✅ Stored summary (ID: ${result.rows[0].id})`);
    return result.rows[0].id;

  } finally {
    await client.end();
  }
}

async function summarizeAndStore(conversation) {
  console.log(`\nSummarizing conversation: ${conversation.channel_id}`);
  console.log(`  Time: ${conversation.start_ts} → ${conversation.end_ts}`);
  console.log(`  Messages: ${conversation.message_count}`);
  
  const summary = await summarizeConversation(conversation);
  console.log(`  TL;DR: ${summary.tldr}`);
  
  const id = await storeSummary(conversation, summary);
  return { id, summary };
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args[0] === '--stdin') {
    // Read conversations from stdin (JSON)
    let input = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => input += chunk);
    process.stdin.on('end', async () => {
      try {
        const conversations = JSON.parse(input);
        console.log(`Processing ${conversations.length} conversations...`);
        
        for (const conv of conversations) {
          await summarizeAndStore(conv);
        }
        
        console.log(`\n✅ Summarized and stored ${conversations.length} conversations`);
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });
  } else {
    console.error('Usage: node summarize-conversation.js --stdin < conversations.json');
    process.exit(1);
  }
}

export { summarizeConversation, storeSummary, summarizeAndStore };
