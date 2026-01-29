#!/usr/bin/env node
/**
 * Search conversation summaries semantically and via full-text
 * Returns relevant past conversations for context injection
 */

import pg from 'pg';

const { Client } = pg;

const DB_URL = process.env.SLACK_DB_URL;

const EMBEDDING_API = process.env.EMBEDDING_API_URL;
const EMBEDDING_API_KEY = process.env.EMBEDDING_API_KEY || 'dummy';

async function generateQueryEmbedding(query) {
  const response = await fetch(EMBEDDING_API, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${EMBEDDING_API_KEY}`
    },
    body: JSON.stringify({
      model: 'BAAI/bge-m3',
      input: query
    })
  });

  if (!response.ok) {
    throw new Error(`Embedding API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function semanticSearch(query, options = {}) {
  const limit = options.limit || 10;
  const channelId = options.channelId;
  const minScore = options.minScore || 0.5;

  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  try {
    // Generate query embedding
    const embedding = await generateQueryEmbedding(query);
    const embeddingStr = `[${embedding.join(',')}]`;

    // Semantic search with cosine similarity
    const searchQuery = `
      SELECT 
        cs.id,
        cs.channel_id,
        sc.name as channel_name,
        cs.start_ts,
        cs.end_ts,
        cs.message_count,
        cs.tldr,
        cs.full_summary,
        cs.participants,
        cs.key_decisions,
        cs.topics,
        cs.outcome,
        1 - (cs.embedding <=> $1::vector) AS similarity
      FROM conversation_summaries cs
      LEFT JOIN slack_channels sc ON cs.channel_id = sc.id
      WHERE cs.embedding IS NOT NULL
        ${channelId ? 'AND cs.channel_id = $3' : ''}
      ORDER BY cs.embedding <=> $1::vector
      LIMIT $2
    `;

    const params = channelId 
      ? [embeddingStr, limit, channelId]
      : [embeddingStr, limit];

    const result = await client.query(searchQuery, params);

    // Filter by minimum score
    const results = result.rows
      .filter(row => row.similarity >= minScore)
      .map(row => ({
        ...row,
        start_ts: row.start_ts.toISOString(),
        end_ts: row.end_ts.toISOString(),
        similarity: parseFloat(row.similarity.toFixed(3))
      }));

    return results;

  } finally {
    await client.end();
  }
}

async function fullTextSearch(query, options = {}) {
  const limit = options.limit || 10;
  const channelId = options.channelId;

  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  try {
    const searchQuery = `
      SELECT 
        cs.id,
        cs.channel_id,
        sc.name as channel_name,
        cs.start_ts,
        cs.end_ts,
        cs.message_count,
        cs.tldr,
        cs.full_summary,
        cs.participants,
        cs.key_decisions,
        cs.topics,
        cs.outcome,
        ts_rank(
          to_tsvector('english', cs.tldr || ' ' || cs.full_summary),
          plainto_tsquery('english', $1)
        ) as rank
      FROM conversation_summaries cs
      LEFT JOIN slack_channels sc ON cs.channel_id = sc.id
      WHERE to_tsvector('english', cs.tldr || ' ' || cs.full_summary) 
            @@ plainto_tsquery('english', $1)
        ${channelId ? 'AND cs.channel_id = $3' : ''}
      ORDER BY rank DESC
      LIMIT $2
    `;

    const params = channelId 
      ? [query, limit, channelId]
      : [query, limit];

    const result = await client.query(searchQuery, params);

    return result.rows.map(row => ({
      ...row,
      start_ts: row.start_ts.toISOString(),
      end_ts: row.end_ts.toISOString(),
      rank: parseFloat(row.rank.toFixed(3))
    }));

  } finally {
    await client.end();
  }
}

async function searchByTopic(topic, options = {}) {
  const limit = options.limit || 10;
  const channelId = options.channelId;

  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  try {
    const query = `
      SELECT 
        cs.id,
        cs.channel_id,
        sc.name as channel_name,
        cs.start_ts,
        cs.end_ts,
        cs.message_count,
        cs.tldr,
        cs.full_summary,
        cs.participants,
        cs.key_decisions,
        cs.topics,
        cs.outcome
      FROM conversation_summaries cs
      LEFT JOIN slack_channels sc ON cs.channel_id = sc.id
      WHERE $1 = ANY(cs.topics)
        ${channelId ? 'AND cs.channel_id = $3' : ''}
      ORDER BY cs.start_ts DESC
      LIMIT $2
    `;

    const params = channelId 
      ? [topic, limit, channelId]
      : [topic, limit];

    const result = await client.query(query, params);

    return result.rows.map(row => ({
      ...row,
      start_ts: row.start_ts.toISOString(),
      end_ts: row.end_ts.toISOString()
    }));

  } finally {
    await client.end();
  }
}

async function getRecentConversations(options = {}) {
  const limit = options.limit || 10;
  const channelId = options.channelId;
  const since = options.since; // ISO date string

  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  try {
    let query = `
      SELECT 
        cs.id,
        cs.channel_id,
        sc.name as channel_name,
        cs.start_ts,
        cs.end_ts,
        cs.message_count,
        cs.tldr,
        cs.full_summary,
        cs.participants,
        cs.key_decisions,
        cs.topics,
        cs.outcome
      FROM conversation_summaries cs
      LEFT JOIN slack_channels sc ON cs.channel_id = sc.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (channelId) {
      paramCount++;
      params.push(channelId);
      query += ` AND cs.channel_id = $${paramCount}`;
    }

    if (since) {
      paramCount++;
      params.push(since);
      query += ` AND cs.start_ts >= $${paramCount}`;
    }

    paramCount++;
    params.push(limit);
    query += ` ORDER BY cs.start_ts DESC LIMIT $${paramCount}`;

    const result = await client.query(query, params);

    return result.rows.map(row => ({
      ...row,
      start_ts: row.start_ts.toISOString(),
      end_ts: row.end_ts.toISOString()
    }));

  } finally {
    await client.end();
  }
}

function formatSearchResults(results) {
  if (results.length === 0) {
    return 'No relevant conversations found.';
  }

  return results.map((r, i) => {
    const date = new Date(r.start_ts).toLocaleDateString();
    const time = new Date(r.start_ts).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return `
${i + 1}. **${r.channel_name || r.channel_id}** (${date} ${time})
   ${r.tldr}
   ${r.topics.length > 0 ? `Topics: ${r.topics.join(', ')}` : ''}
   ${r.key_decisions.length > 0 ? `Decisions: ${r.key_decisions.join('; ')}` : ''}
   ${r.similarity ? `Relevance: ${(r.similarity * 100).toFixed(0)}%` : ''}
`.trim();
  }).join('\n\n');
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const command = args[0];

  const options = {
    limit: 10,
    minScore: 0.5
  };

  if (args.includes('--channel')) {
    const idx = args.indexOf('--channel');
    options.channelId = args[idx + 1];
  }

  if (args.includes('--limit')) {
    const idx = args.indexOf('--limit');
    options.limit = parseInt(args[idx + 1]);
  }

  if (args.includes('--min-score')) {
    const idx = args.indexOf('--min-score');
    options.minScore = parseFloat(args[idx + 1]);
  }

  if (args.includes('--since')) {
    const idx = args.indexOf('--since');
    options.since = args[idx + 1];
  }

  async function run() {
    try {
      let results;

      if (command === 'semantic') {
        const query = args.slice(1).join(' ').replace(/--\w+\s+\S+/g, '').trim();
        if (!query) {
          console.error('Usage: search-conversations.js semantic "your query" [--channel ID] [--limit N]');
          process.exit(1);
        }
        console.log(`Semantic search: "${query}"\n`);
        results = await semanticSearch(query, options);
      } else if (command === 'text') {
        const query = args.slice(1).join(' ').replace(/--\w+\s+\S+/g, '').trim();
        if (!query) {
          console.error('Usage: search-conversations.js text "your query" [--channel ID] [--limit N]');
          process.exit(1);
        }
        console.log(`Full-text search: "${query}"\n`);
        results = await fullTextSearch(query, options);
      } else if (command === 'topic') {
        const topic = args[1];
        if (!topic) {
          console.error('Usage: search-conversations.js topic "topic-name" [--channel ID] [--limit N]');
          process.exit(1);
        }
        console.log(`Topic search: "${topic}"\n`);
        results = await searchByTopic(topic, options);
      } else if (command === 'recent') {
        console.log(`Recent conversations\n`);
        results = await getRecentConversations(options);
      } else {
        console.error(`Unknown command: ${command}`);
        console.error('Commands: semantic, text, topic, recent');
        process.exit(1);
      }

      console.log(formatSearchResults(results));

      if (args.includes('--json')) {
        console.log('\n--- JSON ---');
        console.log(JSON.stringify(results, null, 2));
      }

      process.exit(0);
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  }

  run();
}

export { 
  semanticSearch, 
  fullTextSearch, 
  searchByTopic, 
  getRecentConversations,
  formatSearchResults
};
