-- Slack Context Memory: Conversation Summaries Schema
-- Stores compressed, searchable summaries of Slack conversations

CREATE TABLE IF NOT EXISTS conversation_summaries (
  id SERIAL PRIMARY KEY,
  
  -- Conversation identification
  channel_id TEXT NOT NULL,
  thread_ts TEXT,  -- NULL for channel-level conversations
  conversation_key TEXT GENERATED ALWAYS AS (
    channel_id || COALESCE('_' || thread_ts, '_channel')
  ) STORED,
  
  -- Time boundaries
  start_ts TIMESTAMPTZ NOT NULL,
  end_ts TIMESTAMPTZ NOT NULL,
  message_count INTEGER NOT NULL,
  
  -- Summary content
  tldr TEXT NOT NULL,  -- 1-2 sentence summary
  participants TEXT[] NOT NULL DEFAULT '{}',  -- user_ids
  key_decisions TEXT[] NOT NULL DEFAULT '{}',
  topics TEXT[] NOT NULL DEFAULT '{}',
  outcome TEXT,  -- resolved/ongoing/needs-follow-up/question
  
  -- Raw summary for detailed retrieval
  full_summary TEXT NOT NULL,
  
  -- Semantic search
  embedding VECTOR(1024),  -- BAAI/bge-m3 embeddings
  
  -- Message references
  message_ids TEXT[] NOT NULL DEFAULT '{}',  -- array of message ts values
  first_message_ts TEXT NOT NULL,
  last_message_ts TEXT NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Quality/confidence
  confidence_score FLOAT,  -- 0-1, how confident the summarization is
  
  UNIQUE(channel_id, thread_ts, start_ts)
);

-- Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_summaries_channel 
  ON conversation_summaries(channel_id);
  
CREATE INDEX IF NOT EXISTS idx_summaries_timerange 
  ON conversation_summaries(start_ts, end_ts);
  
CREATE INDEX IF NOT EXISTS idx_summaries_participants 
  ON conversation_summaries USING GIN(participants);
  
CREATE INDEX IF NOT EXISTS idx_summaries_topics 
  ON conversation_summaries USING GIN(topics);

-- Vector similarity search (requires pgvector)
CREATE INDEX IF NOT EXISTS idx_summaries_embedding 
  ON conversation_summaries 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Full-text search on summaries
CREATE INDEX IF NOT EXISTS idx_summaries_fts 
  ON conversation_summaries 
  USING GIN(to_tsvector('english', tldr || ' ' || full_summary));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_summary_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conversation_summary_updated
BEFORE UPDATE ON conversation_summaries
FOR EACH ROW
EXECUTE FUNCTION update_conversation_summary_timestamp();

-- View for human-readable summaries
CREATE OR REPLACE VIEW conversation_summaries_readable AS
SELECT 
  cs.id,
  sc.name as channel_name,
  cs.start_ts::date as date,
  to_char(cs.start_ts, 'HH24:MI') as start_time,
  to_char(cs.end_ts, 'HH24:MI') as end_time,
  cs.message_count,
  cs.tldr,
  array_length(cs.participants, 1) as participant_count,
  cs.outcome,
  cs.topics,
  cs.created_at
FROM conversation_summaries cs
LEFT JOIN slack_channels sc ON cs.channel_id = sc.id
ORDER BY cs.start_ts DESC;

COMMENT ON TABLE conversation_summaries IS 
  'Compressed, semantic-searchable summaries of Slack conversations for context compaction';
COMMENT ON COLUMN conversation_summaries.tldr IS 
  'Ultra-brief 1-2 sentence summary for quick scanning';
COMMENT ON COLUMN conversation_summaries.full_summary IS 
  'Detailed summary with key points, decisions, and context';
COMMENT ON COLUMN conversation_summaries.embedding IS 
  'Vector embedding (BAAI/bge-m3) for semantic similarity search';
COMMENT ON COLUMN conversation_summaries.confidence_score IS 
  'Quality score 0-1: how well the conversation segments and summarizes';
