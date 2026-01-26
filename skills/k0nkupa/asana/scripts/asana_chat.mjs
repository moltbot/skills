#!/usr/bin/env node
/**
 * Very small helper to map chat-ish input into an asana_api.mjs command.
 *
 * This is NOT required for Clawdbot, but makes it easy to support both:
 * - explicit commands: "/asana projects"
 * - natural language: "list tasks assigned to me"
 *
 * Usage:
 *   node asana/scripts/asana_chat.mjs --text "list tasks assigned to me"
 *
 * Output: a JSON object { cmd, args: [] }
 */

function die(msg) {
  console.error(msg);
  process.exit(1);
}

function parseArgs(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      flags[k] = v;
    }
  }
  return flags;
}

function norm(s) {
  return String(s || '')
    .trim()
    .replace(/\s+/g, ' ');
}

function parseDateRange(text) {
  // very simple: from YYYY-MM-DD to YYYY-MM-DD
  const m = text.match(/from\s+(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/i);
  if (!m) return null;
  return { from: m[1], to: m[2] };
}

function main() {
  const flags = parseArgs(process.argv.slice(2));
  const text = norm(flags.text);
  if (!text) die('Missing --text');

  // Slash style
  if (text.toLowerCase().startsWith('/asana ')) {
    const rest = text.slice(7).trim();
    const parts = rest.split(' ');
    return console.log(
      JSON.stringify(
        {
          cmd: parts[0],
          args: parts.slice(1),
        },
        null,
        2,
      ),
    );
  }

  const t = text.toLowerCase();

  // Natural language patterns
  if (t.includes('list') && t.includes('workspace')) {
    return console.log(JSON.stringify({ cmd: 'workspaces', args: [] }, null, 2));
  }

  if ((t.includes('list') || t.includes('show')) && t.includes('project')) {
    return console.log(JSON.stringify({ cmd: 'projects', args: [] }, null, 2));
  }

  if (t.includes('assigned to me') || t.includes('my tasks')) {
    // Optional: "in <project>" requires project gid/name resolution at a higher layer.
    return console.log(JSON.stringify({ cmd: 'tasks-assigned', args: ['--assignee', 'me'] }, null, 2));
  }

  if (t.includes('all tasks in') || t.includes('tasks in project')) {
    // Expect the caller to provide --project elsewhere.
    return console.log(JSON.stringify({ cmd: 'tasks-in-project', args: [] }, null, 2));
  }

  const dr = parseDateRange(text);
  if (dr) {
    // Asana search uses query params; due_on.after / due_on.before are common.
    return console.log(
      JSON.stringify(
        {
          cmd: 'search-tasks',
          args: ['--assignee', 'me', '--due_on.after', dr.from, '--due_on.before', dr.to],
        },
        null,
        2,
      ),
    );
  }

  return console.log(JSON.stringify({ cmd: 'unknown', args: [], note: 'No rule matched.' }, null, 2));
}

main();
