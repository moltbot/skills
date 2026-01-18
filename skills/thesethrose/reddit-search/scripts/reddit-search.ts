#!/usr/bin/env node
const axios = require('axios');
const REDDIT_BASE = 'https://www.reddit.com';
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const reddit = axios.create({
  baseURL: REDDIT_BASE,
  headers: { 'User-Agent': USER_AGENT },
  timeout: 10000
});

// --- HTTP ---
async function requestJson(path) {
  const response = await reddit.get(path);
  return response.data;
}

// --- Reddit API ---
async function getSubredditAbout(name) {
  try {
    const payload = await requestJson(`/r/${name}/about.json`);
    const data = payload.data;
    return {
      name: data.display_name,
      over_18: data.over_18,
      subscribers: data.subscribers,
      description: data.description,
      created_utc: data.created_utc,
      public_description: data.public_description
    };
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}

async function getSubredditsFromSearch(query, limit = 10) {
  const url = `/subreddits/search.json?q=${encodeURIComponent(query)}&limit=${limit}&include_over_18=1`;
  const payload = await requestJson(url);
  return payload.data.children.map(c => c.data.display_name).filter(Boolean);
}

async function getSubredditsFromListing(listing = 'popular', limit = 10) {
  const url = `/subreddits/${listing}.json?limit=${limit}`;
  const payload = await requestJson(url);
  return payload.data.children.map(c => c.data.display_name).filter(Boolean);
}

async function getSubredditPosts(name, sort = 'hot', limit = 5) {
  try {
    const payload = await requestJson(`/r/${name}/${sort}.json?limit=${limit}`);
    return payload.data.children.map(c => c.data);
  } catch (error) {
    if (error.response?.status === 404) return [];
    throw error;
  }
}

function extractSubredditLinks(text) {
  if (!text) return [];
  const regex = /\/r\/([a-zA-Z0-9_-]+)/g;
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push(match[1]);
  }
  return [...new Set(matches)];
}

// --- Formatting ---
function formatNumber(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

// --- Commands ---
async function cmdInfo(name) {
  const normalized = name.toLowerCase().replace(/^r\//, '');
  console.log(`Fetching r/${normalized}...`);
  const about = await getSubredditAbout(normalized);
  if (!about) {
    console.log(`Subreddit "${name}" not found.`);
    return;
  }
  console.log(` === r/${about.name} ===`);
  console.log(`Subscribers: ${formatNumber(about.subscribers)}`);
  console.log(`NSFW: ${about.over_18 ? 'Yes' : 'No'}`);
  console.log(`Created: ${new Date(about.created_utc * 1000).toLocaleDateString()}`);
  console.log(` Description: ${about.public_description || '(none)'}`);
  const linked = extractSubredditLinks([about.description, about.public_description].join(' '));
  if (linked.length > 0) {
    console.log(` → Sidebar links (${linked.length}):`);
    console.log(` ${linked.join(', ')}`);
  }
  console.log('');
}

async function cmdSearch(term, limit = 10) {
  console.log(`Searching for "${term}"...`);
  const subreddits = await getSubredditsFromSearch(term, limit);
  if (subreddits.length === 0) {
    console.log(`No results for "${term}"`);
    return;
  }
  console.log(` Found ${subreddits.length} subreddits: `);
  for (const name of subreddits) {
    console.log(` r/${name}`);
  }
  console.log('');
}

async function cmdListing(type = 'popular', limit = 10) {
  console.log(`Fetching ${type} subreddits...`);
  const subreddits = await getSubredditsFromListing(type, limit);
  console.log(` ${type.charAt(0).toUpperCase() + type.slice(1)} subreddits: `);
  for (const name of subreddits) {
    console.log(` r/${name}`);
  }
  console.log('');
}

async function cmdPosts(name, limit = 5) {
  const normalized = name.toLowerCase().replace(/^r\//, '');
  console.log(`Fetching posts from r/${normalized}...`);
  const posts = await getSubredditPosts(normalized, 'hot', limit);
  if (posts.length === 0) {
    console.log('No posts found.');
    return;
  }
  console.log(` Top ${posts.length} posts: `);
  for (const post of posts) {
    const score = formatNumber(post.score);
    const comments = formatNumber(post.num_comments);
    const title = post.title.length > 60 ? post.title.slice(0, 60) + '...' : post.title;
    console.log(` [${score}↑ ${comments}💬] ${title}`);
  }
  console.log('');
}

function showHelp() {
  console.log(` Reddit Search - Query Reddit JSON endpoints
Usage: reddit-search <command> [args]

Commands:
  info <subreddit>     Get subreddit details + sidebar links
  search <term> [limit] Search for subreddits
  popular [limit]      List popular subreddits
  new [limit]          List new subreddits
  posts <subreddit> [n] Get top posts from a subreddit

Examples:
  reddit-search info programming
  reddit-search search python 20
  reddit-search popular 15
  reddit-search new 10
  reddit-search posts javascript 5
`);
}

// --- Main ---
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const arg1 = args[1];
  const arg2 = args[2];

  try {
    switch (command) {
      case 'info':
        if (!arg1) {
          console.log('Usage: reddit-search info <subreddit>');
          process.exit(1);
        }
        await cmdInfo(arg1);
        break;
      case 'search':
        if (!arg1) {
          console.log('Usage: reddit-search search <term> [limit]');
          process.exit(1);
        }
        await cmdSearch(arg1, parseInt(arg2) || 10);
        break;
      case 'popular':
        await cmdListing('popular', parseInt(arg1) || 10);
        break;
      case 'new':
        await cmdListing('new', parseInt(arg1) || 10);
        break;
      case 'posts':
        if (!arg1) {
          console.log('Usage: reddit-search posts <subreddit> [limit]');
          process.exit(1);
        }
        await cmdPosts(arg1, parseInt(arg2) || 5);
        break;
      case 'help':
      case '--help':
      case '-h':
      default:
        showHelp();
    }
  } catch (err) {
    if (err.response?.status === 429) {
      console.error('Rate limited. Wait a minute and try again.');
    } else {
      console.error('Error:', err.message);
    }
    process.exit(1);
  }
}

main();
