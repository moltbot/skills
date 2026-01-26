#!/usr/bin/env node
/**
 * Minimal Asana API CLI with OAuth refresh.
 *
 * Reads token from ~/.clawdbot/asana/token.json
 * Requires ASANA_CLIENT_ID + ASANA_CLIENT_SECRET for refresh.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const API_BASE = 'https://app.asana.com/api/1.0';
const TOKEN_URL = 'https://app.asana.com/-/oauth_token';

function die(msg) {
  console.error(msg);
  process.exit(1);
}

function tokenPath() {
  return path.join(os.homedir(), '.clawdbot', 'asana', 'token.json');
}

function configPath() {
  return path.join(os.homedir(), '.clawdbot', 'asana', 'config.json');
}

function loadConfig() {
  const p = configPath();
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8')) || {};
  } catch {
    return {};
  }
}

function loadToken() {
  const p = tokenPath();
  if (!fs.existsSync(p)) die(`Token file not found: ${p}. Run oauth_oob.mjs token first.`);
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function saveToken(tok) {
  const p = tokenPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(tok, null, 2));
}

function urlEncode(params) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    u.set(k, String(v));
  }
  return u.toString();
}

async function postForm(url, params) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: urlEncode(params),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response (${res.status}): ${text.slice(0, 300)}`);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function ensureAccessToken(token) {
  const now = Date.now();
  const expiresAt = token.expires_at_ms;
  if (typeof token.access_token !== 'string') die('Token missing access_token');

  // Refresh if expiring within 2 minutes
  if (expiresAt && now < expiresAt - 120_000) return token;

  if (!token.refresh_token) {
    // Some flows may not return refresh_token; in that case user must re-auth.
    return token;
  }

  let clientId = process.env.ASANA_CLIENT_ID;
  let clientSecret = process.env.ASANA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    // Fallback to ~/.clawdbot/asana/credentials.json
    try {
      const credPath = path.join(os.homedir(), '.clawdbot', 'asana', 'credentials.json');
      const creds = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
      clientId = clientId || creds.client_id;
      clientSecret = clientSecret || creds.client_secret;
    } catch {
      // ignore
    }
  }
  if (!clientId || !clientSecret) {
    die(
      'Token needs refresh but ASANA_CLIENT_ID/ASANA_CLIENT_SECRET are not set, and ~/.clawdbot/asana/credentials.json is missing. Run: node skills/asana/scripts/configure.mjs --client-id ... --client-secret ...',
    );
  }

  const data = await postForm(TOKEN_URL, {
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: token.refresh_token,
  });

  const refreshed = {
    ...token,
    ...data,
    obtained_at_ms: now,
    expires_at_ms: typeof data.expires_in === 'number' ? now + data.expires_in * 1000 : null,
  };

  saveToken(refreshed);
  return refreshed;
}

async function asanaGet(pathname, token, query) {
  const url = new URL(API_BASE + pathname);
  if (query) {
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response (${res.status}): ${text.slice(0, 300)}`);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function asanaJson(method, pathname, token, body) {
  const url = API_BASE + pathname;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response (${res.status}): ${text.slice(0, 300)}`);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

const asanaPost = (pathname, token, body) => asanaJson('POST', pathname, token, body);
const asanaPut = (pathname, token, body) => asanaJson('PUT', pathname, token, body);

function parseArgs(argv) {
  const [cmd, ...rest] = argv;
  const flags = {};
  const positionals = [];
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[++i] : true;
      flags[k] = v;
    } else {
      positionals.push(a);
    }
  }
  return { cmd, flags, positionals };
}

function csvList(v) {
  if (!v) return [];
  return String(v)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function resolveMeGid(accessToken) {
  const me = await asanaGet('/users/me', accessToken);
  const gid = me?.data?.gid;
  if (!gid) throw new Error('Could not resolve /users/me gid');
  return String(gid);
}

function printJson(x) {
  console.log(JSON.stringify(x, null, 2));
}

async function main() {
  const { cmd, flags, positionals } = parseArgs(process.argv.slice(2));
  if (!cmd) {
    die(
      'Command required: me | workspaces | list-workspaces | set-default-workspace | projects | tasks-in-project | tasks-assigned | search-tasks | task | update-task | complete-task | comment | create-task',
    );
  }

  let tok = loadToken();
  tok = await ensureAccessToken(tok);
  const accessToken = tok.access_token;
  const cfg = loadConfig();

  const getWorkspaceOrDefault = () => {
    const w = flags.workspace || cfg.default_workspace_gid;
    return w ? String(w) : null;
  };

  if (cmd === 'me') {
    printJson(await asanaGet('/users/me', accessToken));
    return;
  }

  if (cmd === 'workspaces' || cmd === 'list-workspaces') {
    printJson(await asanaGet('/workspaces', accessToken));
    return;
  }

  if (cmd === 'set-default-workspace') {
    const workspace = flags.workspace || positionals[0];
    if (!workspace) die('Usage: set-default-workspace --workspace <workspace_gid>');

    const outPath = configPath();
    const next = { ...cfg, default_workspace_gid: String(workspace) };
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(next, null, 2));
    console.log(`Saved default workspace to: ${outPath}`);
    console.log(`default_workspace_gid = ${next.default_workspace_gid}`);
    return;
  }

  if (cmd === 'projects') {
    const workspace = getWorkspaceOrDefault();
    if (!workspace) die('Missing --workspace <workspace_gid> (or set default via set-default-workspace)');
    const optFields = flags.opt_fields || 'gid,name,resource_type,archived,public';
    const r = await asanaGet('/projects', accessToken, {
      workspace,
      opt_fields: optFields,
      limit: flags.limit || 100,
    });
    printJson(r);
    return;
  }

  if (cmd === 'tasks-in-project') {
    const project = flags.project;
    if (!project) die('Missing --project <project_gid>');
    const optFields =
      flags.opt_fields ||
      'gid,name,completed,completed_at,assignee.name,assignee.gid,due_on,permalink_url,modified_at';
    const r = await asanaGet('/tasks', accessToken, {
      project,
      opt_fields: optFields,
      limit: flags.limit || 100,
    });
    printJson(r);
    return;
  }

  if (cmd === 'tasks-assigned') {
    const workspace = getWorkspaceOrDefault();
    if (!workspace) die('Missing --workspace <workspace_gid> (or set default via set-default-workspace)');
    const assignee = flags.assignee || 'me';
    const assigneeGid = assignee === 'me' ? await resolveMeGid(accessToken) : String(assignee);
    const optFields =
      flags.opt_fields ||
      'gid,name,completed,assignee.name,due_on,projects.name,permalink_url,modified_at';
    const r = await asanaGet('/tasks', accessToken, {
      workspace,
      assignee: assigneeGid,
      // common filter to exclude completed; Asana accepts special values like "now"
      completed_since: flags.completed_since || 'now',
      opt_fields: optFields,
      limit: flags.limit || 100,
    });
    printJson(r);
    return;
  }

  if (cmd === 'search-tasks') {
    const workspace = getWorkspaceOrDefault();
    if (!workspace) die('Missing --workspace <workspace_gid> (or set default via set-default-workspace)');
    // Asana search endpoint uses query params.
    // Common params: text, assignee.any, projects.any, sections.any, completed, completed_on.after/before, due_on.after/before, etc.
    const query = { ...flags };
    delete query._;
    // normalize a couple convenience flags
    if (query.assignee === 'me') query['assignee.any'] = await resolveMeGid(accessToken);
    if (query.project) query['projects.any'] = String(query.project);
    delete query.assignee;
    delete query.project;

    const optFields = query.opt_fields || 'gid,name,completed,assignee.name,due_on,permalink_url';
    delete query.opt_fields;

    const r = await asanaGet(`/workspaces/${workspace}/tasks/search`, accessToken, {
      ...query,
      opt_fields: optFields,
      limit: query.limit || 100,
    });
    printJson(r);
    return;
  }

  if (cmd === 'task') {
    const gid = flags.gid || positionals[0];
    if (!gid) die('Usage: task <task_gid>');
    const optFields =
      flags.opt_fields ||
      'gid,name,completed,assignee.name,assignee.gid,due_on,notes,permalink_url,projects.name,memberships.section.name,modified_at';
    const r = await asanaGet(`/tasks/${gid}`, accessToken, { opt_fields: optFields });
    printJson(r);
    return;
  }

  if (cmd === 'update-task') {
    const gid = flags.gid || positionals[0];
    if (!gid) die('Usage: update-task <task_gid> [--name ...] [--notes ...] [--due_on YYYY-MM-DD] [--completed true|false]');

    const data = {};
    if (flags.name) data.name = String(flags.name);
    if (flags.notes) data.notes = String(flags.notes);
    if (flags.due_on) data.due_on = String(flags.due_on);
    if (flags.completed !== undefined) data.completed = String(flags.completed) === 'true' || flags.completed === true;

    if (Object.keys(data).length === 0) die('No fields provided to update.');

    const r = await asanaPut(`/tasks/${gid}`, accessToken, { data });
    printJson(r);
    return;
  }

  if (cmd === 'complete-task') {
    const gid = flags.gid || positionals[0];
    if (!gid) die('Usage: complete-task <task_gid>');
    const r = await asanaPut(`/tasks/${gid}`, accessToken, { data: { completed: true } });
    printJson(r);
    return;
  }

  if (cmd === 'comment') {
    const gid = flags.gid || flags.task || positionals[0];
    const text = flags.text;
    if (!gid) die('Usage: comment <task_gid> --text "..."');
    if (!text) die('Missing --text');
    // Stories API: POST /tasks/{task_gid}/stories
    const r = await asanaPost(`/tasks/${gid}/stories`, accessToken, { data: { text: String(text) } });
    printJson(r);
    return;
  }

  if (cmd === 'create-task') {
    const workspace = flags.workspace;
    const name = flags.name;
    const notes = flags.notes || '';
    const projects = flags.projects;
    if (!name) die('Missing --name');

    const data = { name, notes };
    if (workspace) data.workspace = String(workspace);
    if (projects) data.projects = csvList(projects);
    if (flags.due_on) data.due_on = String(flags.due_on);

    const r = await asanaPost('/tasks', accessToken, { data });
    printJson(r);
    return;
  }

  die(`Unknown command: ${cmd}`);
}

main().catch((e) => die(String(e?.stack || e)));
