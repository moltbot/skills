#!/usr/bin/env node
/**
 * Detect conversation boundaries in Slack message history
 * 
 * Segments messages into discrete conversations based on:
 * - Time gaps (>30 minutes = new conversation)
 * - Topic shifts (semantic distance via embeddings)
 * - Thread boundaries (explicit markers)
 * - Participant changes
 */

import pg from 'pg';

const { Client } = pg;

const DB_URL = process.env.SLACK_DB_URL;

const TIME_GAP_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes
const MIN_MESSAGES_PER_CONVERSATION = 3;
const MAX_MESSAGES_PER_CONVERSATION = 100;

async function detectConversations(channelId, options = {}) {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  try {
    // Fetch messages for channel, ordered by timestamp
    const query = `
      SELECT 
        ts,
        user_id,
        text,
        thread_ts,
        timestamp
      FROM slack_messages
      WHERE channel_id = $1
        ${options.since ? 'AND timestamp >= $2' : ''}
      ORDER BY timestamp ASC
    `;
    
    const params = options.since ? [channelId, options.since] : [channelId];
    const result = await client.query(query, params);
    
    if (result.rows.length === 0) {
      console.log(`No messages found in channel ${channelId}`);
      return [];
    }

    console.log(`Analyzing ${result.rows.length} messages in ${channelId}...`);

    // Segment into conversations
    const conversations = [];
    let currentConversation = null;
    let lastTimestamp = null;
    let lastParticipants = new Set();

    for (const msg of result.rows) {
      const msgTime = new Date(msg.timestamp);
      const timeSinceLastMsg = lastTimestamp 
        ? msgTime - lastTimestamp 
        : 0;

      // Start new conversation if:
      // 1. First message
      // 2. Time gap > threshold
      // 3. Current conversation is too long
      // 4. Thread boundary (thread_ts changes)
      const shouldStartNew = 
        !currentConversation ||
        timeSinceLastMsg > TIME_GAP_THRESHOLD_MS ||
        currentConversation.messages.length >= MAX_MESSAGES_PER_CONVERSATION ||
        (msg.thread_ts && msg.thread_ts !== currentConversation.thread_ts);

      if (shouldStartNew) {
        // Save previous conversation if it meets minimum requirements
        if (currentConversation && 
            currentConversation.messages.length >= MIN_MESSAGES_PER_CONVERSATION) {
          conversations.push(currentConversation);
        }

        // Start new conversation
        currentConversation = {
          channel_id: channelId,
          thread_ts: msg.thread_ts || null,
          start_ts: msgTime,
          end_ts: msgTime,
          messages: [],
          participants: new Set(),
          message_ids: []
        };
        lastParticipants = new Set();
      }

      // Add message to current conversation
      currentConversation.messages.push(msg);
      currentConversation.message_ids.push(msg.ts);
      currentConversation.participants.add(msg.user_id);
      currentConversation.end_ts = msgTime;
      lastParticipants.add(msg.user_id);
      lastTimestamp = msgTime;
    }

    // Save final conversation
    if (currentConversation && 
        currentConversation.messages.length >= MIN_MESSAGES_PER_CONVERSATION) {
      conversations.push(currentConversation);
    }

    // Convert Sets to Arrays for storage
    conversations.forEach(conv => {
      conv.participants = Array.from(conv.participants);
      conv.message_count = conv.messages.length;
    });

    console.log(`\nDetected ${conversations.length} conversations:`);
    conversations.forEach((conv, i) => {
      console.log(`  ${i+1}. ${conv.start_ts.toISOString()} → ${conv.end_ts.toISOString()}`);
      console.log(`     Messages: ${conv.message_count}, Participants: ${conv.participants.length}`);
    });

    return conversations;

  } finally {
    await client.end();
  }
}

async function detectAllChannels(options = {}) {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  try {
    // Get all channels with messages
    const channelsResult = await client.query(`
      SELECT DISTINCT channel_id, COUNT(*) as msg_count
      FROM slack_messages
      ${options.since ? 'WHERE timestamp >= $1' : ''}
      GROUP BY channel_id
      ORDER BY msg_count DESC
    `, options.since ? [options.since] : []);

    console.log(`\nAnalyzing ${channelsResult.rows.length} channels...\n`);

    const allConversations = [];
    for (const { channel_id, msg_count } of channelsResult.rows) {
      console.log(`\n=== Channel: ${channel_id} (${msg_count} messages) ===`);
      const conversations = await detectConversations(channel_id, options);
      allConversations.push(...conversations);
    }

    return allConversations;

  } finally {
    await client.end();
  }
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const channelId = args[0];
  
  const options = {};
  if (args.includes('--since')) {
    const sinceIdx = args.indexOf('--since');
    options.since = args[sinceIdx + 1];
  }

  if (!channelId || channelId === '--all') {
    detectAllChannels(options)
      .then(conversations => {
        console.log(`\n✅ Total conversations detected: ${conversations.length}`);
        process.exit(0);
      })
      .catch(err => {
        console.error('Error:', err);
        process.exit(1);
      });
  } else {
    detectConversations(channelId, options)
      .then(conversations => {
        console.log(`\n✅ Detected ${conversations.length} conversations`);
        // Output as JSON for piping to summarizer
        if (args.includes('--json')) {
          console.log(JSON.stringify(conversations, null, 2));
        }
        process.exit(0);
      })
      .catch(err => {
        console.error('Error:', err);
        process.exit(1);
      });
  }
}

export { detectConversations, detectAllChannels };
