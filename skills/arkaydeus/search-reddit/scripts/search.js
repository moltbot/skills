#!/usr/bin/env node
/**
 * Search Reddit using OpenAI Responses API web_search with enrichment.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_BASE = 'api.openai.com';
const API_PATH = '/v1/responses';
const DEFAULT_MODEL = process.env.SEARCH_REDDIT_MODEL || 'gpt-5.2';
const DEFAULT_DAYS = parseInt(process.env.SEARCH_REDDIT_DAYS, 10) || 30;

const REDDIT_SEARCH_PROMPT = `Find Reddit discussion threads about: {topic}

STEP 1: EXTRACT THE CORE SUBJECT
Get the MAIN NOUN/PRODUCT/TOPIC:
- "best nano banana prompting practices" → "nano banana"
- "killer features of clawdbot" → "clawdbot"
- "top Claude Code skills" → "Claude Code"
DO NOT include "best", "top", "tips", "practices", "features" in your search.

STEP 2: SEARCH BROADLY
Search for the core subject:
1. "[core subject] site:reddit.com"
2. "reddit [core subject]"
3. "[core subject] reddit"

Return as many relevant threads as you find. We filter by date server-side.

STEP 3: INCLUDE ALL MATCHES
- Include ALL threads about the core subject
- Set date to "YYYY-MM-DD" if you can determine it, otherwise null
- We verify dates and filter old content server-side
- DO NOT pre-filter aggressively - include anything relevant

REQUIRED: URLs must contain "/r/" AND "/comments/"
REJECT: developers.reddit.com, business.reddit.com

Find {min_items}-{max_items} threads. Return MORE rather than fewer.

Return JSON:
{
  "items": [
    {
      "title": "Thread title",
      "url": "https://www.reddit.com/r/sub/comments/xyz/title/",
      "subreddit": "subreddit_name",
      "date": "YYYY-MM-DD or null",
      "why_relevant": "Why relevant",
      "relevance": 0.85
    }
  ]
}`;

function getApiKey() {
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }

  const configPath = path.join(process.env.HOME || '', '.clawdbot', 'clawdbot.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const key = config?.skills?.entries?.['search-reddit']?.apiKey ||
                  config?.skills?.entries?.openai?.apiKey;
      if (key) return key;
    } catch (e) {}
  }

  return null;
}

function parseArgs(args) {
  const result = {
    query: '',
    days: DEFAULT_DAYS,
    subreddits: [],
    excludeSubreddits: [],
    json: false,
    compact: false,
    linksOnly: false,
    model: DEFAULT_MODEL,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === '--days' || arg === '-d') {
      result.days = parseInt(args[++i], 10);
    } else if (arg === '--subreddits' || arg === '-s') {
      result.subreddits = args[++i].split(',').map(s => normalizeSubreddit(s));
    } else if (arg === '--exclude' || arg === '-e') {
      result.excludeSubreddits = args[++i].split(',').map(s => normalizeSubreddit(s));
    } else if (arg === '--json' || arg === '-j') {
      result.json = true;
    } else if (arg === '--compact' || arg === '-c') {
      result.compact = true;
    } else if (arg === '--links-only' || arg === '-l') {
      result.linksOnly = true;
    } else if (arg === '--model' || arg === '-m') {
      result.model = args[++i];
    } else if (!arg.startsWith('-')) {
      result.query = args.slice(i).join(' ');
      break;
    }
    i++;
  }

  return result;
}

function normalizeSubreddit(value) {
  return String(value || '')
    .trim()
    .replace(/^r\//i, '')
    .replace(/^\//, '')
    .toLowerCase();
}

function getDateRange(days) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return {
    from_date: from.toISOString().split('T')[0],
    to_date: to.toISOString().split('T')[0],
    from,
    to,
  };
}

function extractContent(response) {
  if (!response || !response.output) return { text: '', citations: [] };

  let text = '';
  let citations = [];

  for (const item of response.output) {
    if (item.type === 'message' && item.content) {
      for (const c of item.content) {
        if (c.type === 'output_text' && c.text) {
          text = c.text;
        }
        if (c.annotations) {
          for (const ann of c.annotations) {
            if (ann.type === 'url_citation' && ann.url) {
              citations.push(ann.url);
            }
          }
        }
      }
    }
  }

  citations = [...new Set(citations)];
  return { text, citations };
}

function extractItemsFromText(text) {
  const jsonMatch = text.match(/\{[\s\S]*"items"[\s\S]*\}/);
  if (!jsonMatch) return [];
  try {
    const data = JSON.parse(jsonMatch[0]);
    return Array.isArray(data.items) ? data.items : [];
  } catch (e) {
    return [];
  }
}

function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith('reddit.com')) return null;
    if (parsed.hostname.startsWith('developers.') || parsed.hostname.startsWith('business.')) return null;
    const path = parsed.pathname.replace(/\/$/, '');
    return `https://www.reddit.com${path}`;
  } catch (e) {
    return null;
  }
}

function isThreadUrl(url) {
  return url.includes('/r/') && url.includes('/comments/');
}

function extractSubredditFromUrl(url) {
  const match = url.match(/\/r\/([^/]+)/i);
  return match ? normalizeSubreddit(match[1]) : '';
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        // Reddit is more reliable with an explicit UA
        'User-Agent': 'clawdbot-search-reddit/1.0 (+https://docs.clawd.bot)'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
  });
}

function timestampToDate(ts) {
  if (!ts) return null;
  const date = new Date(ts * 1000);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
}

function getTopComments(comments, limit = 10) {
  const valid = comments.filter(c => !['[deleted]', '[removed]'].includes(c.author));
  const sorted = valid.sort((a, b) => (b.score || 0) - (a.score || 0));
  return sorted.slice(0, limit);
}

function extractCommentInsights(comments, limit = 7) {
  const insights = [];
  for (const comment of comments.slice(0, limit * 2)) {
    const body = String(comment.body || '').trim();
    if (!body || body.length < 30) continue;
    const lower = body.toLowerCase();
    const skipPatterns = [
      /^(this|same|agreed|exactly|yep|nope|yes|no|thanks|thank you)\.?$/,
      /^lol|lmao|haha/,
      /^\[deleted\]/,
      /^\[removed\]/,
    ];
    if (skipPatterns.some(p => p.test(lower))) continue;

    let insight = body.slice(0, 150);
    if (body.length > 150) {
      for (let i = 0; i < insight.length; i++) {
        if ('.!?'.includes(insight[i]) && i > 50) {
          insight = insight.slice(0, i + 1);
          break;
        }
      }
      if (insight.length === 150) insight = `${insight.trim()}...`;
    }
    insights.push(insight);
    if (insights.length >= limit) break;
  }
  return insights;
}

async function enrichItem(item) {
  const normalized = normalizeUrl(item.url);
  if (!normalized) return null;

  const pathPart = new URL(normalized).pathname.replace(/\/$/, '');
  const jsonUrl = `https://www.reddit.com${pathPart}.json?raw_json=1`;
  let data;
  try {
    data = await requestJson(jsonUrl);
  } catch (e) {
    return item;
  }

  if (!Array.isArray(data) || data.length < 1) return item;

  const submissionListing = data[0];
  const submissionChild = submissionListing?.data?.children?.[0]?.data || null;
  const commentsListing = data[1];
  const commentChildren = commentsListing?.data?.children || [];

  if (submissionChild) {
    item.engagement = {
      score: submissionChild.score,
      num_comments: submissionChild.num_comments,
      upvote_ratio: submissionChild.upvote_ratio,
    };
    item.date = timestampToDate(submissionChild.created_utc) || item.date || null;
    item.created_utc = submissionChild.created_utc || null;
    if (submissionChild.subreddit) {
      item.subreddit = normalizeSubreddit(submissionChild.subreddit);
    }
    if (submissionChild.permalink) {
      item.url = `https://www.reddit.com${submissionChild.permalink}`.replace(/\/$/, '');
    }
  }

  const comments = [];
  for (const child of commentChildren) {
    if (child?.kind !== 't1') continue;
    const c = child.data || {};
    if (!c.body) continue;
    comments.push({
      score: c.score || 0,
      created_utc: c.created_utc,
      author: c.author || '[deleted]',
      body: c.body || '',
      permalink: c.permalink || '',
    });
  }

  const topComments = getTopComments(comments, 10);
  item.top_comments = topComments.map(c => ({
    score: c.score || 0,
    date: timestampToDate(c.created_utc),
    author: c.author || '',
    excerpt: String(c.body || '').slice(0, 200),
    url: c.permalink ? `https://reddit.com${c.permalink}` : '',
  }));
  item.comment_insights = extractCommentInsights(topComments, 7);

  return item;
}

async function searchReddit(options) {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('❌ No API key found.');
    console.error('   Set OPENAI_API_KEY or run: clawdbot config set skills.entries.search-reddit.apiKey "sk-YOUR-KEY"');
    console.error('   Or set: clawdbot config set skills.entries.openai.apiKey "sk-YOUR-KEY"');
    console.error('   Get your key at: https://platform.openai.com');
    process.exit(1);
  }

  const dateRange = getDateRange(options.days);

  const payload = {
    model: options.model,
    tools: [
      {
        type: 'web_search',
        filters: {
          allowed_domains: ['reddit.com'],
        },
      },
    ],
    input: REDDIT_SEARCH_PROMPT
      .replace('{topic}', options.query)
      .replace('{min_items}', '30')
      .replace('{max_items}', '50'),
    include: ['web_search_call.action.sources'],
  };

  const response = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: API_BASE,
      path: API_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.error(`❌ API Error (${res.statusCode}):`, data.slice(0, 500));
          process.exit(1);
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(payload));
    req.end();
  });

  const { text } = extractContent(response);
  const rawItems = extractItemsFromText(text);

  const cleaned = [];
  const seen = new Set();

  for (let i = 0; i < rawItems.length; i++) {
    const item = rawItems[i];
    if (!item || !item.url) continue;
    const normalizedUrl = normalizeUrl(item.url);
    if (!normalizedUrl || !isThreadUrl(normalizedUrl)) continue;
    if (seen.has(normalizedUrl)) continue;
    seen.add(normalizedUrl);

    const subreddit = normalizeSubreddit(item.subreddit || extractSubredditFromUrl(normalizedUrl));

    cleaned.push({
      id: `R${i + 1}`,
      title: String(item.title || '').trim(),
      url: normalizedUrl,
      subreddit,
      date: item.date || null,
      why_relevant: String(item.why_relevant || '').trim(),
      relevance: Math.min(1, Math.max(0, Number(item.relevance || 0.5))),
    });
  }

  const enriched = [];
  for (const item of cleaned) {
    const full = await enrichItem({ ...item });
    if (!full) continue;
    enriched.push(full);
  }

  const filtered = enriched.filter(item => {
    const subreddit = normalizeSubreddit(item.subreddit || '');
    if (options.subreddits.length && !options.subreddits.includes(subreddit)) {
      return false;
    }
    if (options.excludeSubreddits.length && options.excludeSubreddits.includes(subreddit)) {
      return false;
    }

    const createdUtc = item.created_utc;
    if (createdUtc) {
      const createdDate = new Date(createdUtc * 1000);
      return createdDate >= dateRange.from && createdDate <= dateRange.to;
    }

    // Fallback: if enrichment failed, use the model-provided date (YYYY-MM-DD)
    if (item.date && /^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
      const createdDate = new Date(item.date + 'T00:00:00Z');
      return createdDate >= dateRange.from && createdDate <= dateRange.to;
    }

    return false;
  });

  filtered.sort((a, b) => (b.created_utc || 0) - (a.created_utc || 0));

  return { response, items: filtered };
}

function printCompact(items) {
  if (items.length === 0) {
    console.log('No results found.');
    return;
  }
  for (const item of items) {
    const date = item.date || 'unknown date';
    const sub = item.subreddit ? `r/${item.subreddit}` : 'r/unknown';
    console.log(`${item.title} — ${sub} — ${date}`);
    console.log(item.url);
    console.log('');
  }
}

function printStandard(items) {
  if (items.length === 0) {
    console.log('No results found.');
    return;
  }

  for (const item of items) {
    const sub = item.subreddit ? `r/${item.subreddit}` : 'r/unknown';
    const date = item.date || 'unknown date';
    console.log(`**${item.title || 'Untitled'}**`);
    console.log(`${sub} • ${date}`);
    console.log(item.url);

    if (item.engagement) {
      const score = item.engagement.score ?? 'n/a';
      const comments = item.engagement.num_comments ?? 'n/a';
      const ratio = item.engagement.upvote_ratio ?? 'n/a';
      console.log(`Score: ${score} • Comments: ${comments} • Upvote ratio: ${ratio}`);
    }

    if (item.top_comments && item.top_comments.length) {
      console.log('Top comments:');
      for (const c of item.top_comments.slice(0, 3)) {
        const author = c.author || 'unknown';
        const excerpt = c.excerpt || '';
        console.log(`- ${author} (${c.score}): ${excerpt}`);
      }
    }

    if (item.why_relevant) {
      console.log(`Why relevant: ${item.why_relevant}`);
    }

    console.log('');
  }
}

// Main
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help')) {
  console.log(`
🔍 Search Reddit — Real-time Reddit search via OpenAI web_search

Usage:
  search-reddit [options] "your search query"

Options:
  --days, -d <n>          Search last N days (default: ${DEFAULT_DAYS})
  --subreddits, -s <list> Only these subreddits (comma-separated)
  --exclude, -e <list>    Exclude these subreddits
  --compact, -c           Minimal output
  --links-only, -l        Only output Reddit links
  --json, -j              Output JSON results
  --model, -m <model>     Model (default: ${DEFAULT_MODEL})
  --help                  Show this help

Examples:
  search-reddit "Claude Code tips"
  search-reddit --days 7 "AI news"
  search-reddit --subreddits machinelearning,openai "agents"
  search-reddit --exclude bots "real discussions"
  search-reddit --links-only "trending tech"
`);
  process.exit(0);
}

const options = parseArgs(args);

if (!options.query) {
  console.error('❌ Please provide a search query');
  process.exit(1);
}

if (!options.json && !options.linksOnly) {
  console.error(`🔍 Searching Reddit: "${options.query}" (last ${options.days} days)...\n`);
}

searchReddit(options).then(({ response, items }) => {
  if (options.json) {
    const output = {
      query: options.query,
      days: options.days,
      count: items.length,
      items,
    };
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  if (options.linksOnly) {
    if (items.length) {
      items.forEach(item => console.log(item.url));
    } else {
      console.log('No Reddit links found.');
    }
    return;
  }

  if (options.compact) {
    printCompact(items);
    return;
  }

  printStandard(items);

  const links = items.map(item => item.url);
  if (links.length > 0) {
    console.log(`📎 Links (${links.length}):`);
    links.slice(0, 10).forEach(url => console.log(`   ${url}`));
    if (links.length > 10) {
      console.log(`   ... and ${links.length - 10} more`);
    }
  }
}).catch((err) => {
  console.error('❌ Request failed:', err.message);
  process.exit(1);
});
