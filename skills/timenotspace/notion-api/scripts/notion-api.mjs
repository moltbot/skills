#!/usr/bin/env node
/**
 * notion-api.mjs
 * Minimal Notion API CLI (no deps) for:
 *  - search
 *  - query data_sources
 *  - create page
 *  - retrieve blocks + list/append block children (for simple page editing)
 *
 * Auth:
 *  - NOTION_KEY env var, or ~/.config/notion/api_key
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const NOTION_VERSION = process.env.NOTION_VERSION || '2025-09-03';

function die(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

function readKey() {
  if (process.env.NOTION_KEY && process.env.NOTION_KEY.trim()) return process.env.NOTION_KEY.trim();
  const keyPath = process.env.NOTION_KEY_FILE || path.join(os.homedir(), '.config', 'notion', 'api_key');
  try {
    const v = fs.readFileSync(keyPath, 'utf8').split(/\r?\n/)[0].trim();
    if (!v) die(`Notion key file is empty: ${keyPath}`);
    return v;
  } catch (e) {
    die(`Missing NOTION_KEY and cannot read key file: ${keyPath}`);
  }
}

async function notionFetch(url, { method = 'GET', body } = {}) {
  const key = readKey();
  const headers = {
    'Authorization': `Bearer ${key}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json'
  };
  const res = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = { _raw: text }; }

  if (!res.ok) {
    die(JSON.stringify({ error: true, status: res.status, url, response: json }, null, 2));
  }
  return json;
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') { args._.push(...argv.slice(i + 1)); break; }
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { args[key] = next; i++; }
      else { args[key] = true; }
    } else {
      args._.push(a);
    }
  }
  return args;
}

async function cmdSearch(args) {
  const query = args._.join(' ');
  if (!query) die('usage: search <query> [--page-size N]');
  const page_size = args['page-size'] ? Number(args['page-size']) : 10;
  const out = await notionFetch('https://api.notion.com/v1/search', {
    method: 'POST',
    body: { query, page_size }
  });
  console.log(JSON.stringify(out, null, 2));
}

async function cmdQuery(args) {
  const id = args['data-source-id'] || args['data_source_id'];
  if (!id) die('usage: query --data-source-id <ID> [--page-size N] [--body JSON]');

  if (args.body) {
    let body;
    try { body = JSON.parse(args.body); } catch { die('Invalid JSON for --body'); }
    const out = await notionFetch(`https://api.notion.com/v1/data_sources/${id}/query`, { method: 'POST', body });
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  const page_size = args['page-size'] ? Number(args['page-size']) : 10;
  const out = await notionFetch(`https://api.notion.com/v1/data_sources/${id}/query`, { method: 'POST', body: { page_size } });
  console.log(JSON.stringify(out, null, 2));
}

async function cmdCreatePage(args) {
  const database_id = args['database-id'] || args['database_id'];
  const title = args.title || args._.join(' ');
  const titleProp = args['title-prop'] || 'Name';
  if (!database_id || !title) {
    die('usage: create-page --database-id <ID> --title "Title" [--title-prop Name]');
  }

  const payload = {
    parent: { database_id },
    properties: {
      [titleProp]: {
        title: [{ text: { content: title } }]
      }
    }
  };

  const out = await notionFetch('https://api.notion.com/v1/pages', { method: 'POST', body: payload });
  console.log(JSON.stringify(out, null, 2));
}

async function cmdRetrieveBlock(args) {
  const block_id = args['block-id'] || args['block_id'] || args._[0];
  if (!block_id) die('usage: retrieve-block --block-id <BLOCK_ID>');
  const out = await notionFetch(`https://api.notion.com/v1/blocks/${block_id}`);
  console.log(JSON.stringify(out, null, 2));
}

async function cmdBlockChildren(args) {
  const block_id = args['block-id'] || args['block_id'] || args._[0];
  if (!block_id) die('usage: block-children --block-id <BLOCK_ID> [--page-size N] [--start-cursor CURSOR]');
  const page_size = args['page-size'] ? Number(args['page-size']) : 100;
  const start_cursor = args['start-cursor'] || args['start_cursor'];
  const qs = new URLSearchParams();
  if (page_size) qs.set('page_size', String(page_size));
  if (start_cursor) qs.set('start_cursor', String(start_cursor));
  const url = `https://api.notion.com/v1/blocks/${block_id}/children${qs.toString() ? `?${qs}` : ''}`;
  const out = await notionFetch(url);
  console.log(JSON.stringify(out, null, 2));
}

async function cmdAppendBlocks(args) {
  const block_id = args['block-id'] || args['block_id'] || args._[0];
  if (!block_id) die('usage: append-blocks --block-id <BLOCK_ID> --body "{...}"');
  if (!args.body) die('usage: append-blocks --block-id <BLOCK_ID> --body "{...}"');
  let body;
  try { body = JSON.parse(args.body); } catch { die('Invalid JSON for --body'); }
  const out = await notionFetch(`https://api.notion.com/v1/blocks/${block_id}/children`, { method: 'PATCH', body });
  console.log(JSON.stringify(out, null, 2));
}

async function cmdUpdateBlock(args) {
  const block_id = args['block-id'] || args['block_id'] || args._[0];
  if (!block_id) die('usage: update-block --block-id <BLOCK_ID> --body "{...}"');
  if (!args.body) die('usage: update-block --block-id <BLOCK_ID> --body "{...}"');
  let body;
  try { body = JSON.parse(args.body); } catch { die('Invalid JSON for --body'); }
  const out = await notionFetch(`https://api.notion.com/v1/blocks/${block_id}`, { method: 'PATCH', body });
  console.log(JSON.stringify(out, null, 2));
}

async function main() {
  const argv = process.argv.slice(2);
  const [command, ...rest] = argv;
  if (!command || ['-h', '--help', 'help'].includes(command)) {
    console.log(`notion-api (minimal)

Commands:
  search <query> [--page-size N]
  query --data-source-id <ID> [--page-size N] [--body JSON]
  create-page --database-id <ID> --title "Title" [--title-prop Name]
  retrieve-block --block-id <BLOCK_ID>
  block-children --block-id <BLOCK_ID> [--page-size N] [--start-cursor CURSOR]
  append-blocks --block-id <BLOCK_ID> --body '{"children": [...]}'
  update-block --block-id <BLOCK_ID> --body '{...}'

Auth:
  NOTION_KEY env var, or ~/.config/notion/api_key
`);
    process.exit(0);
  }

  const args = parseArgs(rest);
  switch (command) {
    case 'search':
      await cmdSearch(args);
      break;
    case 'query':
      await cmdQuery(args);
      break;
    case 'create-page':
      await cmdCreatePage(args);
      break;
    case 'retrieve-block':
      await cmdRetrieveBlock(args);
      break;
    case 'block-children':
      await cmdBlockChildren(args);
      break;
    case 'append-blocks':
      await cmdAppendBlocks(args);
      break;
    case 'update-block':
      await cmdUpdateBlock(args);
      break;
    default:
      die(`Unknown command: ${command}`, 2);
  }
}

main().catch((e) => {
  die(String(e?.stack || e));
});
