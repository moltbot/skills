#!/usr/bin/env node
/**
 * Context Compactor for Clawdbot Sessions
 * 
 * Replaces old messages with summaries to reduce context window usage.
 * Call this when loading session context to get a compacted version.
 * 
 * Usage:
 *   node context-compactor.js <channel_id> [--recent N] [--query "search term"]
 * 
 * Output: Compacted context ready for injection into session
 */

import pg from 'pg';

const { Client } = pg;

const DB_URL = process.env.SLACK_DB_URL;
if (!DB_URL) throw new Error('SLACK_DB_URL environment variable required');

/**
 * Get relevant summaries for a channel or query
 */
async function getRelevantSummaries(options = {}) {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  try {
    let query, params;

    if (options.query) {
      // Search-based retrieval
      query = `
        SELECT 
          cs.channel_id,
          sc.name as channel_name,
          cs.start_ts,
          cs.end_ts,
          cs.message_count,
          cs.tldr,
          cs.full_summary,
          cs.key_decisions,
          cs.topics,
          cs.outcome,
          ts_rank(to_tsvector('english', cs.tldr || ' ' || cs.full_summary), 
                  plainto_tsquery('english', $1)) as relevance
        FROM conversation_summaries cs
        LEFT JOIN slack_channels sc ON cs.channel_id = sc.id
        WHERE to_tsvector('english', cs.tldr || ' ' || cs.full_summary) 
              @@ plainto_tsquery('english', $1)
        ORDER BY relevance DESC
        LIMIT $2
      `;
      params = [options.query, options.limit || 5];
    } else if (options.channelId) {
      // Channel-based retrieval
      query = `
        SELECT 
          cs.channel_id,
          sc.name as channel_name,
          cs.start_ts,
          cs.end_ts,
          cs.message_count,
          cs.tldr,
          cs.full_summary,
          cs.key_decisions,
          cs.topics,
          cs.outcome,
          1.0 as relevance
        FROM conversation_summaries cs
        LEFT JOIN slack_channels sc ON cs.channel_id = sc.id
        WHERE cs.channel_id = $1
        ORDER BY cs.start_ts DESC
        LIMIT $2
      `;
      params = [options.channelId, options.limit || 10];
    } else {
      // Recent across all channels
      query = `
        SELECT 
          cs.channel_id,
          sc.name as channel_name,
          cs.start_ts,
          cs.end_ts,
          cs.message_count,
          cs.tldr,
          cs.full_summary,
          cs.key_decisions,
          cs.topics,
          cs.outcome,
          1.0 as relevance
        FROM conversation_summaries cs
        LEFT JOIN slack_channels sc ON cs.channel_id = sc.id
        ORDER BY cs.end_ts DESC
        LIMIT $1
      `;
      params = [options.limit || 10];
    }

    const result = await client.query(query, params);
    return result.rows;

  } finally {
    await client.end();
  }
}

/**
 * Get recent messages from Slack database
 */
async function getRecentMessages(channelId, limit = 20) {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  try {
    const result = await client.query(`
      SELECT 
        m.ts,
        m.user_id,
        su.name as user_name,
        m.text,
        m.timestamp
      FROM slack_messages m
      LEFT JOIN slack_users su ON m.user_id = su.id
      WHERE m.channel_id = $1
      ORDER BY m.timestamp DESC
      LIMIT $2
    `, [channelId, limit]);

    return result.rows.reverse(); // Chronological order
  } finally {
    await client.end();
  }
}

/**
 * Format summaries for context injection
 */
function formatSummariesForContext(summaries) {
  if (summaries.length === 0) {
    return '';
  }

  let output = '📚 **Previous Conversations (Summarized)**\n\n';

  for (const s of summaries) {
    const date = new Date(s.start_ts).toLocaleDateString();
    const channel = s.channel_name || s.channel_id;
    
    output += `**#${channel}** (${date}, ${s.message_count} messages)\n`;
    output += `${s.tldr}\n`;
    
    if (s.key_decisions && s.key_decisions.length > 0) {
      output += `Decisions: ${s.key_decisions.slice(0, 3).join('; ')}\n`;
    }
    
    if (s.outcome && s.outcome !== 'unknown') {
      output += `Status: ${s.outcome}\n`;
    }
    
    output += '\n';
  }

  return output;
}

/**
 * Format recent messages for context
 */
function formatRecentMessages(messages, channelName) {
  if (messages.length === 0) {
    return '';
  }

  let output = `\n💬 **Recent Messages** (#${channelName}, last ${messages.length})\n\n`;

  for (const m of messages) {
    const time = new Date(m.timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const user = m.user_name || m.user_id;
    const text = m.text?.substring(0, 200) || '';
    output += `[${time}] ${user}: ${text}\n`;
  }

  return output;
}

/**
 * Build compacted context for a session
 */
async function buildCompactedContext(options = {}) {
  const {
    channelId,
    query,
    recentMessageCount = 20,
    summaryLimit = 5,
    includeRecentMessages = true
  } = options;

  // Get relevant summaries
  const summaries = await getRelevantSummaries({
    channelId,
    query,
    limit: summaryLimit
  });

  // Get recent messages if requested
  let recentMessages = [];
  let channelName = channelId;
  
  if (includeRecentMessages && channelId) {
    recentMessages = await getRecentMessages(channelId, recentMessageCount);
    
    // Get channel name
    const client = new Client({ connectionString: DB_URL });
    await client.connect();
    const nameResult = await client.query(
      'SELECT name FROM slack_channels WHERE id = $1', 
      [channelId]
    );
    channelName = nameResult.rows[0]?.name || channelId;
    await client.end();
  }

  // Build compacted context
  const summaryContext = formatSummariesForContext(summaries);
  const recentContext = formatRecentMessages(recentMessages, channelName);

  // Calculate token estimates (rough: 1 token ≈ 4 chars)
  const summaryTokens = Math.ceil(summaryContext.length / 4);
  const recentTokens = Math.ceil(recentContext.length / 4);
  const totalTokens = summaryTokens + recentTokens;

  return {
    context: summaryContext + recentContext,
    stats: {
      summaryCount: summaries.length,
      recentMessageCount: recentMessages.length,
      estimatedTokens: {
        summaries: summaryTokens,
        recent: recentTokens,
        total: totalTokens
      }
    },
    summaries,
    recentMessages
  };
}

/**
 * Compare original vs compacted context size
 */
async function compareContextSizes(channelId) {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  try {
    // Get all messages for channel
    const allMessages = await client.query(`
      SELECT text FROM slack_messages WHERE channel_id = $1
    `, [channelId]);

    const originalText = allMessages.rows.map(r => r.text).join('\n');
    const originalTokens = Math.ceil(originalText.length / 4);

    // Get compacted version
    const compacted = await buildCompactedContext({
      channelId,
      recentMessageCount: 20,
      summaryLimit: 5
    });

    const savings = originalTokens - compacted.stats.estimatedTokens.total;
    const savingsPercent = ((savings / originalTokens) * 100).toFixed(1);

    return {
      original: {
        messages: allMessages.rows.length,
        estimatedTokens: originalTokens
      },
      compacted: {
        summaries: compacted.stats.summaryCount,
        recentMessages: compacted.stats.recentMessageCount,
        estimatedTokens: compacted.stats.estimatedTokens.total
      },
      savings: {
        tokens: savings,
        percent: savingsPercent
      }
    };

  } finally {
    await client.end();
  }
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const channelId = args[0];

  const options = {
    channelId,
    recentMessageCount: 20,
    summaryLimit: 5
  };

  // Parse options
  if (args.includes('--recent')) {
    const idx = args.indexOf('--recent');
    options.recentMessageCount = parseInt(args[idx + 1]) || 20;
  }

  if (args.includes('--query')) {
    const idx = args.indexOf('--query');
    options.query = args[idx + 1];
  }

  if (args.includes('--compare')) {
    // Compare mode
    if (!channelId) {
      console.error('Usage: node context-compactor.js <channel_id> --compare');
      process.exit(1);
    }

    console.log(`\n📊 Context Size Comparison for ${channelId}\n`);
    
    const comparison = await compareContextSizes(channelId);
    
    console.log('Original Context:');
    console.log(`  Messages: ${comparison.original.messages}`);
    console.log(`  Est. Tokens: ${comparison.original.estimatedTokens.toLocaleString()}`);
    
    console.log('\nCompacted Context:');
    console.log(`  Summaries: ${comparison.compacted.summaries}`);
    console.log(`  Recent Messages: ${comparison.compacted.recentMessages}`);
    console.log(`  Est. Tokens: ${comparison.compacted.estimatedTokens.toLocaleString()}`);
    
    console.log('\nSavings:');
    console.log(`  Tokens saved: ${comparison.savings.tokens.toLocaleString()}`);
    console.log(`  Reduction: ${comparison.savings.percent}%`);
    
    process.exit(0);
  }

  // Build compacted context
  const result = await buildCompactedContext(options);

  console.log(result.context);
  console.log('\n---');
  console.log(`📊 Stats: ${result.stats.summaryCount} summaries + ${result.stats.recentMessageCount} recent messages`);
  console.log(`📊 Est. tokens: ${result.stats.estimatedTokens.total.toLocaleString()}`);

  if (args.includes('--json')) {
    console.log('\n---JSON---');
    console.log(JSON.stringify(result, null, 2));
  }
}

export { 
  buildCompactedContext, 
  getRelevantSummaries, 
  getRecentMessages,
  compareContextSizes,
  formatSummariesForContext
};
