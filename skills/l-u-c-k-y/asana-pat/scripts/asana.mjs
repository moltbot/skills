#!/usr/bin/env node
/**
 * Asana (PAT) CLI for Clawdbot / Clawd skills
 *
 * - Authentication: Personal Access Token (PAT) via env var
 * - Zero external dependencies (Node 18+)
 * - JSON-only output (stdout)
 *
 * Intended usage: the agent calls this script with a single command per run.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const API_BASE = "https://app.asana.com/api/1.0";

/**
 * Token env vars (in priority order).
 * Clawdbot typically injects apiKey into the skill's primary env var.
 */
const TOKEN_ENV_VARS = ["ASANA_PAT", "ASANA_TOKEN"];

const DEFAULT_CONFIG_PATH = path.join(os.homedir(), ".clawdbot", "skills", "asana-pat.json");
const LEGACY_CONFIG_PATHS = [
  path.join(os.homedir(), ".clawdbot", "skills", "asana.json"),
  path.join(os.homedir(), ".clawd", "skills", "asana.json"),
];

/** -------------------------------------------------------------------------- */
/** Helpers                                                                    */
/** -------------------------------------------------------------------------- */

function die(msg, extra = undefined, code = 1) {
  const payload = { error: { message: String(msg) } };
  if (extra !== undefined) payload.error.extra = extra;
  process.stdout.write(JSON.stringify(payload, null, 2) + "\n");
  process.exit(code);
}

function emit(obj) {
  process.stdout.write(JSON.stringify(obj, null, 2) + "\n");
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a) continue;

    // Support --key=value
    if (a.startsWith("--") && a.includes("=")) {
      const [k, ...rest] = a.slice(2).split("=");
      out[k] = rest.join("=") || true;
      continue;
    }

    if (a.startsWith("--")) {
      const k = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !String(next).startsWith("--")) {
        out[k] = next;
        i++;
      } else {
        out[k] = true;
      }
      continue;
    }

    out._.push(a);
  }
  return out;
}

function asInt(v, def = undefined) {
  if (v === undefined || v === null || v === "") return def;
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.trunc(n);
}

function asBool(v, def = undefined) {
  if (v === undefined || v === null) return def;
  if (typeof v === "boolean") return v;
  const s = String(v).trim().toLowerCase();
  if (["true", "1", "yes", "y", "on"].includes(s)) return true;
  if (["false", "0", "no", "n", "off"].includes(s)) return false;
  return def;
}

function asNullableString(v) {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const s = String(v).trim();
  if (s.toLowerCase() === "null") return null;
  if (s === "") return undefined;
  return s;
}

function csvToArray(v) {
  if (!v) return [];
  return String(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseJsonOrDie(v, label) {
  if (v === undefined || v === null || v === "") return undefined;
  try {
    return JSON.parse(String(v));
  } catch (e) {
    die(`Invalid JSON for --${label}`, { value: v, error: e?.message || String(e) });
  }
}

function ensureDirForFile(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

const MIME_BY_EXT = {
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".csv": "text/csv",
  ".json": "application/json",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".heic": "image/heic",
  ".bmp": "image/bmp",
};

function guessMimeType(filePath) {
  const ext = path.extname(String(filePath)).toLowerCase();
  return MIME_BY_EXT[ext] || "application/octet-stream";
}

/**
 * Append an inline-image <img> tag into an Asana rich text field.
 * Asana rich text must be valid XML and wrapped in a <body> root element.
 */
function appendInlineImageToBody(existingHtml, attachmentGid) {
  const gid = String(attachmentGid);
  const imgTag = `<img data-asana-gid="${gid}"/>`;

  if (!existingHtml || typeof existingHtml !== "string" || existingHtml.trim() === "") {
    return `<body>${imgTag}</body>`;
  }

  const html = existingHtml;
  const closeIdx = html.lastIndexOf("</body>");
  if (closeIdx !== -1) {
    return html.slice(0, closeIdx) + imgTag + html.slice(closeIdx);
  }

  // Defensive fallback: wrap if the server returned something unexpected
  return `<body>${html}${imgTag}</body>`;
}


/** -------------------------------------------------------------------------- */
/** Local config (defaults + contexts)                                          */
/** -------------------------------------------------------------------------- */

function getConfigSearchPaths() {
  const paths = [];
  if (process.env.ASANA_CONFIG_PATH) paths.push(process.env.ASANA_CONFIG_PATH);
  paths.push(DEFAULT_CONFIG_PATH);
  for (const lp of LEGACY_CONFIG_PATHS) paths.push(lp);
  return paths;
}

function getPrimaryConfigPath() {
  return process.env.ASANA_CONFIG_PATH || DEFAULT_CONFIG_PATH;
}

function loadConfig() {
  for (const p of getConfigSearchPaths()) {
    if (!p) continue;
    if (!fs.existsSync(p)) continue;
    try {
      const raw = fs.readFileSync(p, "utf-8");
      const cfg = JSON.parse(raw);
      return cfg && typeof cfg === "object" ? cfg : {};
    } catch (e) {
      // Ignore invalid JSON and continue searching
    }
  }
  return {};
}

function saveConfig(cfg) {
  const p = getPrimaryConfigPath();
  ensureDirForFile(p);
  fs.writeFileSync(p, JSON.stringify(cfg, null, 2), "utf-8");
}

function getDefaultWorkspaceGid(cfg) {
  // Resolution order: explicit env, active context, stored default
  if (process.env.ASANA_DEFAULT_WORKSPACE) return String(process.env.ASANA_DEFAULT_WORKSPACE);
  const ctxName = cfg?.active_context;
  if (ctxName && cfg?.contexts && cfg.contexts[ctxName]?.workspace_gid) {
    return String(cfg.contexts[ctxName].workspace_gid);
  }
  if (cfg?.default_workspace_gid) return String(cfg.default_workspace_gid);
  return null;
}

function resolveWorkspaceGid(flags, cfg, { required = false } = {}) {
  if (flags.workspace) return String(flags.workspace);
  const w = getDefaultWorkspaceGid(cfg);
  if (w) return w;
  if (required) die("Missing required --workspace (and no default workspace configured).");
  return null;
}

function resolveProjectGid(flags, cfg, { required = false } = {}) {
  if (flags.project) return String(flags.project);
  const ctxName = cfg?.active_context;
  if (ctxName && cfg?.contexts && cfg.contexts[ctxName]?.default_project_gid) {
    return String(cfg.contexts[ctxName].default_project_gid);
  }
  if (required) die("Missing required --project (and no default project configured for the active context).");
  return null;
}

/** -------------------------------------------------------------------------- */
/** Auth + HTTP                                                                 */
/** -------------------------------------------------------------------------- */

function getToken() {
  for (const k of TOKEN_ENV_VARS) {
    const v = process.env[k];
    if (v && String(v).trim()) return String(v).trim();
  }
  die(`Missing Asana PAT. Set one of: ${TOKEN_ENV_VARS.join(", ")}`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}


class AsanaApiError extends Error {
  constructor(message, details) {
    super(message);
    this.name = "AsanaApiError";
    this.details = details;
  }
}

async function request(method, apiPath, { query = null, body = null, token = null, retries = 3 } = {}) {
  const t = token || getToken();

  const url = new URL(API_BASE + apiPath);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === "") continue;
      url.searchParams.set(k, String(v));
    }
  }

  const headers = {
    Authorization: `Bearer ${t}`,
    Accept: "application/json",
  };

  let payload = undefined;
  if (body !== null && body !== undefined) {
    // Support JSON bodies (default) and multipart/form-data (attachments).
    // If `body` is a FormData instance, fetch will set the correct Content-Type boundary.
    const isFd = typeof FormData !== "undefined" && body instanceof FormData;
    if (isFd) {
      payload = body;
    } else {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    const resp = await fetch(url.toString(), { method, headers, body: payload });

    // Some endpoints can return empty bodies (204, etc.)
    const text = await resp.text();
    const json = text ? safeJsonParse(text) : null;

    if (resp.ok) return json ?? { data: {} };

    const status = resp.status;
    const retryable =
      status === 429 || status === 500 || status === 502 || status === 503 || status === 504;

    if (retryable && attempt < retries) {
      const backoffMs = 250 * Math.pow(2, attempt);
      await sleep(backoffMs);
      continue;
    }

    throw new AsanaApiError("Asana API request failed", {
      method,
      apiPath,
      status,
      url: url.toString(),
      response: json ?? text,
    });
  }

  throw new AsanaApiError("Asana API request failed (exhausted retries)", { method, apiPath });
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function paginateGet(apiPath, { query = {}, all = false, limit = 100, token = null } = {}) {
  const results = [];
  let offset = undefined;

  while (true) {
    const q = { ...query, limit, offset };
    const page = await request("GET", apiPath, { query: q, token });

    const data = page?.data;
    if (Array.isArray(data)) results.push(...data);
    else if (data) results.push(data);

    if (!all || !page?.next_page?.offset) break;
    offset = page.next_page.offset;
  }

  return results;
}

/** -------------------------------------------------------------------------- */
/** Date shifting helpers                                                       */
/** -------------------------------------------------------------------------- */

function parseISODateOnly(yyyy_mm_dd) {
  // Treat as UTC date, safe for lexicographic comparisons and arithmetic.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(yyyy_mm_dd).trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  return new Date(Date.UTC(y, mo, d));
}

function formatISODateOnly(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function shiftDateOnly(yyyy_mm_dd, deltaDays) {
  const dt = parseISODateOnly(yyyy_mm_dd);
  if (!dt) return null;
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return formatISODateOnly(dt);
}

function shiftDateTime(iso, deltaDays) {
  const dt = new Date(String(iso));
  if (Number.isNaN(dt.getTime())) return null;
  dt.setTime(dt.getTime() + deltaDays * 24 * 60 * 60 * 1000);
  return dt.toISOString();
}

/** -------------------------------------------------------------------------- */
/** CLI                                                                        */
/** -------------------------------------------------------------------------- */

function printHelp() {
  const lines = [
    "Asana (PAT) CLI for Clawdbot",
    "",
    "Usage:",
    "  node {baseDir}/scripts/asana.mjs <command> [args] [--flags]",
    "",
    "Auth:",
    "  - Set ASANA_PAT (preferred) or ASANA_TOKEN in the environment.",
    "",
    "Config helpers (stored locally, NOT in Asana):",
    "  me",
    "  workspaces",
    "  set-default-workspace --workspace <workspace_gid>",
    "  contexts",
    "  set-context --name <context_name> --workspace <workspace_gid> [--project <project_gid>]",
    "  use-context --name <context_name>",
    "  clear-context [--name <context_name>]",
    "",
    "Discovery:",
    "  projects [--workspace <gid>] [--all] [--limit 100]",
    "  project <project_gid> [--opt_fields <csv>]",
    "  teams [--workspace <gid>] [--all]",
    "  users [--workspace <gid>] [--all]",
    "  typeahead --workspace <gid> --resource_type project|task|user|team|tag|portfolio|goal --query \"...\" [--count 20]",
    "",
    "Tasks:",
    "  tasks-assigned --assignee me|<gid|email> [--workspace <gid>] [--all]",
    "  tasks-in-project --project <project_gid> [--all]",
    "  project-timeline --project <project_gid> [--include_completed false] [--all]",
    "  task <task_gid> [--opt_fields <csv>]",
    "  create-task --workspace <gid> --name \"...\" [--notes \"...\"] [--assignee me|<gid|email>] [--projects <csv>] [--due_on YYYY-MM-DD] [--due_at <iso>] [--start_on YYYY-MM-DD] [--start_at <iso>] [--resource_subtype default_task|milestone|approval] [--parent <task_gid>] [--custom_fields <json>]",
    "  update-task <task_gid> [--name \"...\"] [--notes \"...\"] [--assignee me|<gid|email>] [--completed true|false] [--due_on YYYY-MM-DD|null] [--due_at <iso|null>] [--start_on YYYY-MM-DD|null] [--start_at <iso|null>] [--resource_subtype default_task|milestone|approval] [--custom_fields <json>]",
    "  complete-task <task_gid>",
    "  comment <task_gid> (--text \"...\" OR --html_text \"...\") [--ensure_followers <csv>] [--wait_ms 2000] [--no_wait true]",
    "  stories <task_gid> [--all] [--limit 100]",
    "  comments <task_gid> [--all] [--limit 100]",
"",
"Attachments / files:",
"  attachments <parent_gid> [--opt_fields <csv>] [--all] [--limit 100]",
"  attachment <attachment_gid> [--opt_fields <csv>]",
"  upload-attachment --parent <gid> --file <path> [--filename <name>] [--content_type <mime>] [--opt_fields <csv>]",
"  create-external-attachment --parent <gid> --name \"...\" --url \"...\" [--opt_fields <csv>]",
"  delete-attachment <attachment_gid>",
"  append-inline-image --attachment <attachment_gid> (--task <task_gid> | --project_brief <project_brief_gid>)",
    "  add-task-followers <task_gid> --followers <csv_of_user_gids_or_emails_or_me>",
    "  remove-task-followers <task_gid> --followers <csv_of_user_gids_or_emails_or_me>",
    "  search-tasks --workspace <gid> [--text \"...\"] [--assignee me|<gid|email>] [--project <gid>] [--completed true|false] [--is_blocked true|false] [--is_blocking true|false] ...",
    "",
    "Project structure (PM conveniences):",
    "  update-project <project_gid> [--name \"...\"] [--notes \"...\"] [--html_notes \"...\"] [--start_on YYYY-MM-DD|null] [--due_on YYYY-MM-DD|null] [--archived true|false] [--public true|false] [--color <name>]",
    "  project-brief <project_gid>",
    "  upsert-project-brief <project_gid> [--title \"...\"] (--html_text \"...\" OR --text \"...\")",
    "  project-custom-fields <project_gid> [--all] [--limit 100]",
    "  custom-field <custom_field_gid>",
    "  project-task-counts <project_gid>",
    "  project-members <project_gid>",
    "  add-project-members <project_gid> --members <csv_of_user_gids_or_emails_or_me>",
    "  remove-project-members <project_gid> --members <csv_of_user_gids_or_emails_or_me>",
    "  add-project-followers <project_gid> --followers <csv_of_user_gids_or_emails_or_me>",
    "  remove-project-followers <project_gid> --followers <csv_of_user_gids_or_emails_or_me>",
    "  sections --project <project_gid> [--all]",
    "  create-section --project <project_gid> --name \"...\"",
    "  add-task-to-project <task_gid> --project <project_gid> [--section <section_gid>] [--insert_before <task_gid|null>] [--insert_after <task_gid|null>]",
    "  remove-task-from-project <task_gid> --project <project_gid>",
    "  add-task-to-section --section <section_gid> --task <task_gid> [--insert_before <task_gid>] [--insert_after <task_gid>]",
    "",
    "Dependencies / blockers:",
    "  dependencies <task_gid> [--all]",
    "  dependents <task_gid> [--all]",
    "  add-dependencies <task_gid> --dependencies <csv_task_gids>",
    "  remove-dependencies <task_gid> --dependencies <csv_task_gids>",
    "  project-blockers --project <project_gid> [--workspace <workspace_gid>]",
    "",
    "Status updates:",
    "  status-updates --parent <project_gid|portfolio_gid|goal_gid> [--created_since <iso>] [--all]",
    "  status-update <status_update_gid>",
    "  create-status-update --parent <gid> --status_type on_track|at_risk|off_track|on_hold|complete|achieved|partial|missed|dropped --text \"...\" [--title \"...\"] [--html_text \"...\"]",
    "  delete-status-update <status_update_gid>",
    "",
    "Activity / events (incremental change feed):",
    "  events --resource <gid> [--reset true|false] [--max_pages 5] [--no_save true|false]",
    "  clear-events-sync --resource <gid>",
    "",
    "Timeline shifting (use with care):",
    "  shift-task-dates <task_gid> --delta_days <int> [--dry_run true|false] [--include_subtasks true|false]",
    "  shift-project-tasks --project <project_gid> --delta_days <int> [--dry_run true|false] [--include_completed true|false] [--all]",
    "",
    "Project dashboard (computed summary):",
    "  project-dashboard --project <project_gid> [--workspace <workspace_gid>] [--due_within_days 7] [--include_completed false] [--all]",
  ];
  emit({ help: lines.join("\n") });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];

  const cfg = loadConfig();

  if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") {
    printHelp();
    return;
  }

  switch (cmd) {
    /** ------------------------------------------------------------------ */
    /** Auth sanity + config helpers                                         */
    /** ------------------------------------------------------------------ */

    case "me": {
      const res = await request("GET", "/users/me", {
        query: { opt_fields: args.opt_fields || "gid,name,email,workspaces.gid,workspaces.name" },
      });
      emit(res);
      return;
    }

    case "workspaces": {
      const res = await request("GET", "/workspaces", {
        query: { opt_fields: args.opt_fields || "gid,name,resource_type" },
      });
      emit(res);
      return;
    }

    case "set-default-workspace": {
      const w = args.workspace;
      if (!w) die("Usage: set-default-workspace --workspace <workspace_gid>");
      cfg.default_workspace_gid = String(w);
      // Do not overwrite contexts, etc.
      saveConfig(cfg);
      emit({ ok: true, default_workspace_gid: cfg.default_workspace_gid, config_path: getPrimaryConfigPath() });
      return;
    }

    case "contexts": {
      emit({
        active_context: cfg.active_context || null,
        default_workspace_gid: cfg.default_workspace_gid || null,
        contexts: cfg.contexts || {},
        event_sync_tokens: cfg.event_sync_tokens || {},
        config_path: getPrimaryConfigPath(),
      });
      return;
    }

    case "set-context": {
      const name = args.name;
      const workspace = args.workspace;
      const project = args.project;
      if (!name || !workspace) die("Usage: set-context --name <context_name> --workspace <workspace_gid> [--project <project_gid>]");
      cfg.contexts = cfg.contexts || {};
      cfg.contexts[String(name)] = {
        workspace_gid: String(workspace),
        ...(project ? { default_project_gid: String(project) } : {}),
      };
      saveConfig(cfg);
      emit({ ok: true, active_context: cfg.active_context || null, contexts: cfg.contexts, config_path: getPrimaryConfigPath() });
      return;
    }

    case "use-context": {
      const name = args.name;
      if (!name) die("Usage: use-context --name <context_name>");
      if (!cfg.contexts || !cfg.contexts[String(name)]) die(`Unknown context: ${name}`);
      cfg.active_context = String(name);
      saveConfig(cfg);
      emit({ ok: true, active_context: cfg.active_context, context: cfg.contexts[cfg.active_context], config_path: getPrimaryConfigPath() });
      return;
    }

    case "clear-context": {
      const name = args.name;
      if (name) {
        if (cfg.contexts && cfg.contexts[String(name)]) delete cfg.contexts[String(name)];
        if (cfg.active_context === String(name)) cfg.active_context = null;
      } else {
        cfg.active_context = null;
      }
      saveConfig(cfg);
      emit({ ok: true, active_context: cfg.active_context || null, contexts: cfg.contexts || {}, config_path: getPrimaryConfigPath() });
      return;
    }

    /** ------------------------------------------------------------------ */
    /** Discovery                                                            */
    /** ------------------------------------------------------------------ */

    case "projects": {
      const workspace = resolveWorkspaceGid(args, cfg, { required: true });
      const all = asBool(args.all, false);
      const limit = asInt(args.limit, 100);
      const projects = await paginateGet("/projects", {
        query: {
          workspace,
          opt_fields: args.opt_fields || "gid,name,archived,public,permalink_url,workspace.gid,workspace.name",
        },
        all,
        limit,
      });
      emit({ data: projects });
      return;
    }

    case "project": {
      const projectGid = args._[1];
      if (!projectGid) die("Usage: project <project_gid>");
      const res = await request("GET", `/projects/${projectGid}`, {
        query: {
          opt_fields:
            args.opt_fields ||
            "gid,name,archived,public,notes,html_notes,start_on,due_on,permalink_url,workspace.gid,workspace.name,team.gid,team.name,owner.gid,owner.name,current_status_update.gid,current_status_update.title,current_status_update.status_type,current_status_update.text",
        },
      });
      emit(res);
      return;
    }

    case "teams": {
      const workspace = resolveWorkspaceGid(args, cfg, { required: true });
      const all = asBool(args.all, false);
      const limit = asInt(args.limit, 100);
      const teams = await paginateGet(`/workspaces/${workspace}/teams`, {
        query: { opt_fields: args.opt_fields || "gid,name,permalink_url,organization.gid,organization.name" },
        all,
        limit,
      });
      emit({ data: teams });
      return;
    }

    case "users": {
      const workspace = resolveWorkspaceGid(args, cfg, { required: true });
      const all = asBool(args.all, false);
      const limit = asInt(args.limit, 100);
      const users = await paginateGet(`/workspaces/${workspace}/users`, {
        query: { opt_fields: args.opt_fields || "gid,name,email" },
        all,
        limit,
      });
      emit({ data: users });
      return;
    }

    case "typeahead": {
      const workspace = resolveWorkspaceGid(args, cfg, { required: true });
      const resource_type = args.resource_type || args.type;
      const query = args.query ?? "";
      const count = asInt(args.count, 20);
      if (!resource_type) die("Usage: typeahead --workspace <gid> --resource_type project|task|user|team|tag|portfolio|goal --query \"...\" [--count 20]");
      const res = await request("GET", `/workspaces/${workspace}/typeahead`, {
        query: {
          resource_type,
          query,
          count,
          opt_fields: args.opt_fields || "name",
        },
      });
      emit(res);
      return;
    }

    /** ------------------------------------------------------------------ */
    /** Tasks                                                                */
    /** ------------------------------------------------------------------ */

    case "tasks-assigned": {
      const assignee = args.assignee;
      if (!assignee) die("Usage: tasks-assigned --assignee me|<gid|email> [--workspace <gid>]");

      const workspace = resolveWorkspaceGid(args, cfg, { required: true });
      const all = asBool(args.all, false);
      const limit = asInt(args.limit, 100);

      const tasks = await paginateGet("/tasks", {
        query: {
          assignee,
          workspace,
          completed_since: "now",
          opt_fields:
            args.opt_fields ||
            "gid,name,completed,completed_at,assignee.gid,assignee.name,due_on,due_at,start_on,start_at,resource_subtype,permalink_url,modified_at",
        },
        all,
        limit,
      });

      emit({ data: tasks });
      return;
    }

    case "tasks-in-project": {
      const project = resolveProjectGid(args, cfg, { required: true });
      const all = asBool(args.all, false);
      const limit = asInt(args.limit, 100);

      const tasks = await paginateGet("/tasks", {
        query: {
          project,
          completed_since: "now",
          opt_fields:
            args.opt_fields ||
            "gid,name,completed,assignee.gid,assignee.name,due_on,due_at,start_on,start_at,resource_subtype,permalink_url,modified_at",
        },
        all,
        limit,
      });

      emit({ data: tasks });
      return;
    }

    case "project-timeline": {
      const project = resolveProjectGid(args, cfg, { required: true });
      const include_completed = asBool(args.include_completed, false);
      const all = asBool(args.all, false);
      const limit = asInt(args.limit, 100);

      const tasks = await paginateGet("/tasks", {
        query: {
          project,
          completed_since: include_completed ? "1970-01-01T00:00:00.000Z" : "now",
          opt_fields:
            args.opt_fields ||
            "gid,name,completed,assignee.name,assignee.gid,start_on,start_at,due_on,due_at,resource_subtype,permalink_url,modified_at",
        },
        all,
        limit,
      });

      // Sort: start date first, then due date, then name.
      const sorted = [...tasks].sort((a, b) => {
        const aStart = a.start_on || a.start_at || "";
        const bStart = b.start_on || b.start_at || "";
        if (aStart !== bStart) return String(aStart).localeCompare(String(bStart));
        const aDue = a.due_on || a.due_at || "";
        const bDue = b.due_on || b.due_at || "";
        if (aDue !== bDue) return String(aDue).localeCompare(String(bDue));
        return String(a.name || "").localeCompare(String(b.name || ""));
      });

      emit({ data: sorted });
      return;
    }

    case "task": {
      const taskGid = args._[1];
      if (!taskGid) die("Usage: task <task_gid>");
      const res = await request("GET", `/tasks/${taskGid}`, {
        query: {
          opt_fields:
            args.opt_fields ||
            "gid,name,resource_subtype,completed,completed_at,assignee.gid,assignee.name,due_on,due_at,start_on,start_at,notes,html_notes,permalink_url,projects.gid,projects.name,memberships.project.gid,memberships.project.name,memberships.section.gid,memberships.section.name,dependencies.gid,dependencies.name,dependents.gid,dependents.name,modified_at",
        },
      });
      emit(res);
      return;
    }

    case "create-task": {
      const workspace = resolveWorkspaceGid(args, cfg, { required: true });
      const name = args.name;
      if (!name) die("Usage: create-task --workspace <gid> --name \"...\" [--notes \"...\"] ...");

      const body = {
        data: {
          workspace,
          name,
        },
      };

      if (args.notes) body.data.notes = args.notes;
      if (args.html_notes) body.data.html_notes = args.html_notes;
      if (args.assignee) body.data.assignee = args.assignee;

      if (args.due_on !== undefined) body.data.due_on = asNullableString(args.due_on);
      if (args.due_at !== undefined) body.data.due_at = asNullableString(args.due_at);
      if (args.start_on !== undefined) body.data.start_on = asNullableString(args.start_on);
      if (args.start_at !== undefined) body.data.start_at = asNullableString(args.start_at);

      if (args.resource_subtype) body.data.resource_subtype = args.resource_subtype;
      if (args.parent) body.data.parent = args.parent;

      if (args.projects) body.data.projects = csvToArray(args.projects);
      if (args.followers) body.data.followers = csvToArray(args.followers);

      // Custom fields (JSON): { "custom_field_gid": value, ... }
      if (args.custom_fields !== undefined) {
        const cf = parseJsonOrDie(args.custom_fields, "custom_fields");
        if (cf !== undefined) body.data.custom_fields = cf;
      }

      const res = await request("POST", "/tasks", {
        body,
        query: { opt_fields: args.opt_fields || "gid,name,permalink_url" },
      });
      emit(res);
      return;
    }

    case "update-task": {
      const taskGid = args._[1];
      if (!taskGid) die("Usage: update-task <task_gid> [--name ...] [--due_on ...] ...");

      const data = {};
      if (args.name !== undefined) data.name = args.name;
      if (args.notes !== undefined) data.notes = args.notes;
      if (args.html_notes !== undefined) data.html_notes = args.html_notes;
      if (args.assignee !== undefined) data.assignee = asNullableString(args.assignee);
      if (args.completed !== undefined) data.completed = asBool(args.completed);

      if (args.due_on !== undefined) data.due_on = asNullableString(args.due_on);
      if (args.due_at !== undefined) data.due_at = asNullableString(args.due_at);
      if (args.start_on !== undefined) data.start_on = asNullableString(args.start_on);
      if (args.start_at !== undefined) data.start_at = asNullableString(args.start_at);

      // Custom fields (JSON): { "custom_field_gid": value, ... }
      if (args.custom_fields !== undefined) {
        const cf = parseJsonOrDie(args.custom_fields, "custom_fields");
        if (cf !== undefined) data.custom_fields = cf;
      }

      if (args.resource_subtype !== undefined) data.resource_subtype = args.resource_subtype;

      if (Object.keys(data).length === 0) die("No fields provided to update-task.");

      const res = await request("PUT", `/tasks/${taskGid}`, {
        body: { data },
        query: { opt_fields: args.opt_fields || "gid,name,completed,assignee.name,due_on,due_at,start_on,start_at,resource_subtype,permalink_url" },
      });
      emit(res);
      return;
    }

    case "complete-task": {
      const taskGid = args._[1];
      if (!taskGid) die("Usage: complete-task <task_gid>");
      const res = await request("PUT", `/tasks/${taskGid}`, {
        body: { data: { completed: true } },
        query: { opt_fields: args.opt_fields || "gid,name,completed,completed_at,permalink_url" },
      });
      emit(res);
      return;
    }

    case "comment": {
      const taskGid = args._[1];
      const text = args.text;
      const html_text = args.html_text;

      if (!taskGid)
        die(
          "Usage: comment <task_gid> --text \"...\" OR --html_text \"...\" [--ensure_followers <csv>] [--wait_ms 2000] [--no_wait true]"
        );

      if (!text && !html_text)
        die(
          "Usage: comment <task_gid> --text \"...\" OR --html_text \"...\" [--ensure_followers <csv>] [--wait_ms 2000] [--no_wait true]"
        );

      if (text && html_text)
        die("Provide only one of --text or --html_text when creating a comment (story).");

      // IMPORTANT: @-mentions in rich text only reliably notify users if they are already
      // followers (or assignee) of the task. So if the caller requests followers to be
      // added, do it BEFORE creating the story, then wait briefly for propagation.
      // See Asana rich text guide: addFollowers + wait a few seconds before POST /stories.
      const ensureFollowersRaw = args.ensure_followers || args.add_followers || args.followers;
      const ensuredFollowers = ensureFollowersRaw ? csvToArray(ensureFollowersRaw) : [];

      if (ensuredFollowers.length > 0) {
        await request("POST", `/tasks/${taskGid}/addFollowers`, {
          body: { data: { followers: ensuredFollowers } },
        });

        const waitMs = args.wait_ms !== undefined ? parseInt(String(args.wait_ms), 10) : 2000;
        if (!asBool(args.no_wait) && Number.isFinite(waitMs) && waitMs > 0) {
          await sleep(waitMs);
        }
      }

      const storyData = {};
      if (text) storyData.text = text;
      if (html_text) storyData.html_text = html_text;

      const res = await request("POST", `/tasks/${taskGid}/stories`, {
        body: { data: storyData },
        query: {
          opt_fields:
            args.opt_fields ||
            "gid,resource_type,type,created_at,text,html_text,created_by.gid,created_by.name",
        },
      });

      if (ensuredFollowers.length > 0) {
        emit({ ...res, ensured_followers: ensuredFollowers });
        return;
      }

      emit(res);
      return;
    }

case "stories": {
      const taskGid = args._[1];
      if (!taskGid) die("Usage: stories <task_gid> [--all] [--limit 100]");

      const all = asBool(args.all, false);
      const limit = asInt(args.limit, 100);

      const stories = await paginateGet(`/tasks/${taskGid}/stories`, {
        query: {
          opt_fields:
            args.opt_fields ||
            "gid,resource_type,type,created_at,created_by.gid,created_by.name,text,html_text",
        },
        all,
        limit,
      });

      emit({ data: stories });
      return;
    }

    case "comments": {
      const taskGid = args._[1];
      if (!taskGid) die("Usage: comments <task_gid> [--all] [--limit 100]");

      const all = asBool(args.all, false);
      const limit = asInt(args.limit, 100);

      const stories = await paginateGet(`/tasks/${taskGid}/stories`, {
        query: {
          opt_fields:
            args.opt_fields ||
            "gid,resource_type,type,created_at,created_by.gid,created_by.name,text,html_text",
        },
        all,
        limit,
      });

      const comments = stories.filter((s) => String(s?.type || "") === "comment");
      emit({ data: comments });
      return;
    }

    case "add-task-followers": {
      const taskGid = args._[1];
      const followersArg = args.followers || args.add_followers;
      if (!taskGid || !followersArg)
        die("Usage: add-task-followers <task_gid> --followers <csv_of_user_gids_or_emails_or_me>");

      const followers = csvToArray(followersArg);
      const res = await request("POST", `/tasks/${taskGid}/addFollowers`, {
        body: { data: { followers } },
      });
      emit(res);
      return;
    }

    case "remove-task-followers": {
      const taskGid = args._[1];
      const followersArg = args.followers || args.remove_followers;
      if (!taskGid || !followersArg)
        die(
          "Usage: remove-task-followers <task_gid> --followers <csv_of_user_gids_or_emails_or_me>"
        );

      const followers = csvToArray(followersArg);
      const res = await request("POST", `/tasks/${taskGid}/removeFollowers`, {
        body: { data: { followers } },
      });
      emit(res);
      return;
    }

    case "search-tasks": {
      const workspace = resolveWorkspaceGid(args, cfg, { required: true });

      const q = {
        opt_fields:
          args.opt_fields ||
          "gid,name,completed,assignee.name,assignee.gid,due_on,due_at,start_on,start_at,resource_subtype,permalink_url,modified_at",
      };

      // Common filters
      if (args.text) q.text = args.text;
      if (args.assignee) q["assignee.any"] = args.assignee;
      if (args.project) q["projects.any"] = args.project;
      if (args.completed !== undefined) q.completed = asBool(args.completed);
      if (args.is_blocked !== undefined) q.is_blocked = asBool(args.is_blocked);
      if (args.is_blocking !== undefined) q.is_blocking = asBool(args.is_blocking);

      // Optional date / datetime filters (pass-through). Prefer *_at.* per API spec,
      // but accept legacy *_on.* values as well.
      const passthrough = [
        "due_on.before",
        "due_on.after",
        "due_at.before",
        "due_at.after",
        "start_on.before",
        "start_on.after",
        "completed_at.before",
        "completed_at.after",
        "modified_at.before",
        "modified_at.after",
        "created_at.before",
        "created_at.after",
        // Legacy aliases seen in older client code
        "completed_on.before",
        "completed_on.after",
        "modified_on.before",
        "modified_on.after",
        "created_on.before",
        "created_on.after",
      ];
      for (const k of passthrough) {
        if (args[k] !== undefined) q[k] = args[k];
      }

      // Convenience: map *_on.* -> *_at.* when caller did not specify *_at.* explicitly.
      for (const [legacy, modern] of [
        ["completed_on.before", "completed_at.before"],
        ["completed_on.after", "completed_at.after"],
        ["modified_on.before", "modified_at.before"],
        ["modified_on.after", "modified_at.after"],
        ["created_on.before", "created_at.before"],
        ["created_on.after", "created_at.after"],
      ]) {
        if (args[legacy] !== undefined && args[modern] === undefined) q[modern] = args[legacy];
      }

      if (args.sort_by) q.sort_by = args.sort_by;
      if (args.sort_ascending !== undefined) q.sort_ascending = asBool(args.sort_ascending);

      const all = asBool(args.all, false);
      const limit = asInt(args.limit, 100);

      const tasks = await paginateGet(`/workspaces/${workspace}/tasks/search`, {
        query: q,
        all,
        limit,
      });

      emit({ data: tasks });
      return;
    }

    /** ------------------------------------------------------------------ */
    /** Projects / PM conveniences                                           */
    /** ------------------------------------------------------------------ */
/** ------------------------------------------------------------------ */
/** Attachments / files                                                 */
/** ------------------------------------------------------------------ */

case "attachments": {
  const parent = args._[1] || args.parent;
  if (!parent) die("Usage: attachments <parent_gid> [--opt_fields <csv>] [--all] [--limit 100]");

  const opt_fields =
    args.opt_fields ||
    "gid,name,resource_subtype,created_at,permanent_url,download_url,view_url,size,parent.gid,parent.resource_type,parent.name";
  const list = await paginateGet("/attachments", {
    query: { parent, opt_fields },
    all: asBool(args.all),
    limit: args.limit ? parseInt(String(args.limit), 10) : 100,
  });
  emit({ data: list });
  return;
}

case "attachment": {
  const attachmentGid = args._[1];
  if (!attachmentGid) die("Usage: attachment <attachment_gid> [--opt_fields <csv>]");
  const res = await request("GET", `/attachments/${attachmentGid}`, {
    query: {
      opt_fields:
        args.opt_fields ||
        "gid,name,resource_subtype,created_at,permanent_url,download_url,view_url,size,parent.gid,parent.resource_type,parent.name",
    },
  });
  emit(res);
  return;
}

case "upload-attachment": {
  const parent = args.parent || args._[1];
  const filePath = args.file;
  if (!parent || !filePath)
    die("Usage: upload-attachment --parent <gid> --file <path> [--filename <name>] [--content_type <mime>] [--opt_fields <csv>]");

  const absPath = path.resolve(String(filePath));
  if (!fs.existsSync(absPath)) die("File not found for upload", { file: absPath });

  const filename = args.filename ? String(args.filename) : path.basename(absPath);
  const contentType = args.content_type || args.mime || guessMimeType(absPath);

  // multipart/form-data
  const form = new FormData();
  form.append("parent", String(parent));
  // Default resource_subtype for file uploads is "asana"; allow override for completeness.
  if (args.resource_subtype) form.append("resource_subtype", String(args.resource_subtype));

  const blob = new Blob([fs.readFileSync(absPath)], { type: String(contentType) });
  form.append("file", blob, filename);

  const res = await request("POST", "/attachments", {
    body: form,
    query: {
      opt_fields:
        args.opt_fields ||
        "gid,name,resource_subtype,created_at,permanent_url,download_url,view_url,size,parent.gid,parent.resource_type,parent.name",
    },
  });
  emit(res);
  return;
}

case "create-external-attachment": {
  const parent = args.parent || args._[1];
  const name = args.name;
  const url = args.url;
  if (!parent || !name || !url)
    die(
      "Usage: create-external-attachment --parent <gid> --name \"...\" --url \"...\" [--opt_fields <csv>]"
    );

  const form = new FormData();
  form.append("parent", String(parent));
  form.append("resource_subtype", "external");
  form.append("name", String(name));
  form.append("url", String(url));

  const res = await request("POST", "/attachments", {
    body: form,
    query: {
      opt_fields:
        args.opt_fields ||
        "gid,name,resource_subtype,created_at,permanent_url,download_url,view_url,parent.gid,parent.resource_type,parent.name",
    },
  });
  emit(res);
  return;
}

case "delete-attachment": {
  const attachmentGid = args._[1];
  if (!attachmentGid) die("Usage: delete-attachment <attachment_gid>");
  const res = await request("DELETE", `/attachments/${attachmentGid}`);
  emit(res);
  return;
}

case "append-inline-image": {
  const attachmentGid = args.attachment || args.attachment_gid;
  const taskGid = args.task;
  const briefGid = args.project_brief;

  if (!attachmentGid || (!taskGid && !briefGid) || (taskGid && briefGid))
    die(
      "Usage: append-inline-image --attachment <attachment_gid> (--task <task_gid> | --project_brief <project_brief_gid>) [--skip_verify true]"
    );

  // Optional safety check: inline images must already be attached to the target object.
  if (!asBool(args.skip_verify)) {
    const a = await request("GET", `/attachments/${attachmentGid}`, {
      query: { opt_fields: "gid,parent.gid,parent.resource_type,parent.name,resource_subtype,name" },
    });
    const p = a?.data?.parent;
    const targetGid = String(taskGid || briefGid);
    const expectedType = taskGid ? "task" : "project_brief";
    if (!p || String(p.gid) !== targetGid || String(p.resource_type) !== expectedType) {
      die("Attachment is not attached to the specified target object", {
        attachment_gid: attachmentGid,
        attachment_parent: p,
        expected: { gid: targetGid, resource_type: expectedType },
        hint:
          "Upload the image to the same target first (upload-attachment --parent <gid> --file <path>). Then retry append-inline-image.",
      });
    }
  }

  if (taskGid) {
    const current = await request("GET", `/tasks/${taskGid}`, {
      query: { opt_fields: "gid,html_notes" },
    });

    const updated = appendInlineImageToBody(current?.data?.html_notes, attachmentGid);

    const res = await request("PUT", `/tasks/${taskGid}`, {
      body: { data: { html_notes: updated } },
      query: { opt_fields: args.opt_fields || "gid,name,permalink_url,html_notes" },
    });
    emit(res);
    return;
  }

  // project brief
  const current = await request("GET", `/project_briefs/${briefGid}`, {
    query: { opt_fields: "gid,title,html_text" },
  });

  const updated = appendInlineImageToBody(current?.data?.html_text, attachmentGid);

  const res = await request("PUT", `/project_briefs/${briefGid}`, {
    body: { data: { html_text: updated } },
    query: { opt_fields: args.opt_fields || "gid,title,permalink_url,html_text" },
  });
  emit(res);
  return;
}



    case "update-project": {
      const projectGid = args._[1];
      if (!projectGid) die("Usage: update-project <project_gid> [--name ...] [--notes ...] ...");

      const data = {};
      if (args.name !== undefined) data.name = args.name;
      if (args.notes !== undefined) data.notes = args.notes;
      if (args.html_notes !== undefined) data.html_notes = args.html_notes;

      if (args.start_on !== undefined) data.start_on = asNullableString(args.start_on);
      if (args.due_on !== undefined) data.due_on = asNullableString(args.due_on);

      if (args.archived !== undefined) data.archived = asBool(args.archived);
      if (args.public !== undefined) data.public = asBool(args.public);
      if (args.color !== undefined) data.color = args.color;

      if (Object.keys(data).length === 0) die("No fields provided to update-project.");

      const res = await request("PUT", `/projects/${projectGid}`, {
        body: { data },
        query: {
          opt_fields:
            args.opt_fields ||
            "gid,name,archived,public,notes,html_notes,start_on,due_on,permalink_url,workspace.gid,workspace.name,team.gid,team.name,owner.gid,owner.name",
        },
      });
      emit(res);
      return;
    }

    case "project-brief": {
      const projectGid = args._[1];
      if (!projectGid) die("Usage: project-brief <project_gid>");

      // The project object exposes the associated project_brief as a compact object.
      const pRes = await request("GET", `/projects/${projectGid}`, {
        query: { opt_fields: args.opt_fields || "gid,name,project_brief.gid" },
      });

      const briefGid = pRes?.data?.project_brief?.gid;
      if (!briefGid) {
        emit({ project: pRes.data, project_brief: null });
        return;
      }

      const bRes = await request("GET", `/project_briefs/${briefGid}`, {
        query: {
          opt_fields:
            args.brief_opt_fields ||
            "gid,title,html_text,text,permalink_url,project.gid,project.name",
        },
      });

      emit({ project: pRes.data, project_brief: bRes.data });
      return;
    }

    case "upsert-project-brief": {
      const projectGid = args._[1];
      if (!projectGid)
        die(
          "Usage: upsert-project-brief <project_gid> [--title \"...\"] (--html_text \"...\" OR --text \"...\")"
        );

      const title = args.title;
      const html_text = args.html_text;
      const text = args.text;

      if (text && html_text) die("Provide only one of --text or --html_text.");

      const data = {};
      if (title !== undefined) data.title = title;
      if (html_text !== undefined) data.html_text = html_text;
      if (text !== undefined) data.text = text;

      if (Object.keys(data).length === 0) die("No fields provided to upsert-project-brief.");

      const pRes = await request("GET", `/projects/${projectGid}`, {
        query: { opt_fields: "gid,name,project_brief.gid" },
      });
      const briefGid = pRes?.data?.project_brief?.gid;

      let bRes;
      let action;
      if (briefGid) {
        action = "updated";
        bRes = await request("PUT", `/project_briefs/${briefGid}`, {
          body: { data },
          query: {
            opt_fields:
              args.opt_fields ||
              "gid,title,html_text,text,permalink_url,project.gid,project.name",
          },
        });
      } else {
        action = "created";
        bRes = await request("POST", `/projects/${projectGid}/project_briefs`, {
          body: { data },
          query: {
            opt_fields:
              args.opt_fields ||
              "gid,title,html_text,text,permalink_url,project.gid,project.name",
          },
        });
      }

      emit({ action, project: pRes.data, project_brief: bRes.data });
      return;
    }

    case "project-custom-fields": {
      const projectGid = args._[1];
      if (!projectGid) die("Usage: project-custom-fields <project_gid> [--all] [--limit 100]");

      const all = asBool(args.all, false);
      const limit = asInt(args.limit, 100);

      const rows = await paginateGet(`/projects/${projectGid}/custom_field_settings`, {
        query: {
          opt_fields:
            args.opt_fields ||
            "gid,custom_field.gid,custom_field.name,custom_field.resource_subtype,custom_field.enum_options.gid,custom_field.enum_options.name,is_important,project.gid",
        },
        all,
        limit,
      });

      emit({ data: rows });
      return;
    }

    case "custom-field": {
      const customFieldGid = args._[1];
      if (!customFieldGid) die("Usage: custom-field <custom_field_gid>");
      const res = await request("GET", `/custom_fields/${customFieldGid}`, {
        query: {
          opt_fields:
            args.opt_fields ||
            "gid,name,resource_subtype,enum_options.gid,enum_options.name,precision,format,description,created_by.gid,created_by.name",
        },
      });
      emit(res);
      return;
    }

    case "project-task-counts": {
      const projectGid = args._[1];
      if (!projectGid) die("Usage: project-task-counts <project_gid>");
      const res = await request("GET", `/projects/${projectGid}/task_counts`, {
        query: { opt_fields: args.opt_fields || "num_tasks,num_incomplete_tasks,num_completed_tasks,num_milestones" },
      });
      emit(res);
      return;
    }

    case "project-members": {
      const projectGid = args._[1];
      if (!projectGid) die("Usage: project-members <project_gid>");
      const res = await request("GET", `/projects/${projectGid}`, {
        query: { opt_fields: args.opt_fields || "gid,name,members.gid,members.name,members.email" },
      });
      emit({ project: res?.data ? { gid: res.data.gid, name: res.data.name } : null, members: res?.data?.members || [] });
      return;
    }

    case "add-project-members": {
      const projectGid = args._[1];
      const members = args.members;
      if (!projectGid || !members) die("Usage: add-project-members <project_gid> --members <csv_of_user_gids_or_emails_or_me>");
      const res = await request("POST", `/projects/${projectGid}/addMembers`, {
        body: { data: { members: String(members) } },
      });
      emit(res);
      return;
    }

    case "remove-project-members": {
      const projectGid = args._[1];
      const members = args.members;
      if (!projectGid || !members) die("Usage: remove-project-members <project_gid> --members <csv_of_user_gids_or_emails_or_me>");
      const res = await request("POST", `/projects/${projectGid}/removeMembers`, {
        body: { data: { members: String(members) } },
      });
      emit(res);
      return;
    }

    case "add-project-followers": {
      const projectGid = args._[1];
      const followers = args.followers;
      if (!projectGid || !followers) die("Usage: add-project-followers <project_gid> --followers <csv_of_user_gids_or_emails_or_me>");
      const res = await request("POST", `/projects/${projectGid}/addFollowers`, {
        body: { data: { followers: String(followers) } },
      });
      emit(res);
      return;
    }

    case "remove-project-followers": {
      const projectGid = args._[1];
      const followers = args.followers;
      if (!projectGid || !followers) die("Usage: remove-project-followers <project_gid> --followers <csv_of_user_gids_or_emails_or_me>");
      const res = await request("POST", `/projects/${projectGid}/removeFollowers`, {
        body: { data: { followers: String(followers) } },
      });
      emit(res);
      return;
    }

    case "sections": {
      const project = resolveProjectGid(args, cfg, { required: true });
      const all = asBool(args.all, false);
      const limit = asInt(args.limit, 100);
      const sections = await paginateGet(`/projects/${project}/sections`, {
        query: { opt_fields: args.opt_fields || "gid,name,resource_type" },
        all,
        limit,
      });
      emit({ data: sections });
      return;
    }

    case "create-section": {
      const project = resolveProjectGid(args, cfg, { required: true });
      const name = args.name;
      if (!name) die("Usage: create-section --project <project_gid> --name \"...\"");
      const res = await request("POST", `/projects/${project}/sections`, {
        body: { data: { name } },
        query: { opt_fields: args.opt_fields || "gid,name" },
      });
      emit(res);
      return;
    }

    case "add-task-to-project": {
      const taskGid = args._[1];
      const project = resolveProjectGid(args, cfg, { required: true });
      if (!taskGid) die("Usage: add-task-to-project <task_gid> --project <project_gid> [--section <section_gid>] ...");

      const data = { project };
      if (args.section !== undefined) data.section = asNullableString(args.section);
      if (args.insert_before !== undefined) data.insert_before = asNullableString(args.insert_before);
      if (args.insert_after !== undefined) data.insert_after = asNullableString(args.insert_after);

      const res = await request("POST", `/tasks/${taskGid}/addProject`, { body: { data } });
      emit(res);
      return;
    }

    case "remove-task-from-project": {
      const taskGid = args._[1];
      const project = resolveProjectGid(args, cfg, { required: true });
      if (!taskGid) die("Usage: remove-task-from-project <task_gid> --project <project_gid>");
      const res = await request("POST", `/tasks/${taskGid}/removeProject`, { body: { data: { project } } });
      emit(res);
      return;
    }

    case "add-task-to-section": {
      const section = args.section;
      const task = args.task;
      if (!section || !task) die("Usage: add-task-to-section --section <section_gid> --task <task_gid> [--insert_before <task_gid>] [--insert_after <task_gid>]");
      const data = { task };
      if (args.insert_before) data.insert_before = args.insert_before;
      if (args.insert_after) data.insert_after = args.insert_after;

      const res = await request("POST", `/sections/${section}/addTask`, { body: { data } });
      emit(res);
      return;
    }

    /** ------------------------------------------------------------------ */
    /** Dependencies / blockers                                              */
    /** ------------------------------------------------------------------ */

    case "dependencies": {
      const taskGid = args._[1];
      if (!taskGid) die("Usage: dependencies <task_gid>");
      const all = asBool(args.all, false);
      const limit = asInt(args.limit, 100);
      const deps = await paginateGet(`/tasks/${taskGid}/dependencies`, {
        query: { opt_fields: args.opt_fields || "gid,name,completed,permalink_url" },
        all,
        limit,
      });
      emit({ data: deps });
      return;
    }

    case "dependents": {
      const taskGid = args._[1];
      if (!taskGid) die("Usage: dependents <task_gid>");
      const all = asBool(args.all, false);
      const limit = asInt(args.limit, 100);
      const deps = await paginateGet(`/tasks/${taskGid}/dependents`, {
        query: { opt_fields: args.opt_fields || "gid,name,completed,permalink_url" },
        all,
        limit,
      });
      emit({ data: deps });
      return;
    }

    case "add-dependencies": {
      const taskGid = args._[1];
      const dependencies = csvToArray(args.dependencies);
      if (!taskGid || dependencies.length === 0) die("Usage: add-dependencies <task_gid> --dependencies <csv_task_gids>");
      const res = await request("POST", `/tasks/${taskGid}/addDependencies`, {
        body: { data: { dependencies } },
      });
      emit(res);
      return;
    }

    case "remove-dependencies": {
      const taskGid = args._[1];
      const dependencies = csvToArray(args.dependencies);
      if (!taskGid || dependencies.length === 0) die("Usage: remove-dependencies <task_gid> --dependencies <csv_task_gids>");
      const res = await request("POST", `/tasks/${taskGid}/removeDependencies`, {
        body: { data: { dependencies } },
      });
      emit(res);
      return;
    }

    case "project-blockers": {
      const project = resolveProjectGid(args, cfg, { required: true });

      // Workspace can be provided explicitly, otherwise fetch from project.
      let workspace = args.workspace ? String(args.workspace) : null;
      if (!workspace) {
        const proj = await request("GET", `/projects/${project}`, { query: { opt_fields: "workspace.gid" } });
        workspace = proj?.data?.workspace?.gid ? String(proj.data.workspace.gid) : null;
      }
      if (!workspace) die("Unable to resolve workspace for project. Pass --workspace explicitly.");

      const common = {
        "projects.any": project,
        completed: false,
        opt_fields: args.opt_fields || "gid,name,assignee.name,due_on,due_at,start_on,start_at,permalink_url,modified_at",
      };

      let blocked = [];
      let blocking = [];

      // In some plans/accounts, dependency features may not be enabled.
      // If search fails, return partial results with an error payload.
      let blocked_error = null;
      let blocking_error = null;

      try {
        blocked = await paginateGet(`/workspaces/${workspace}/tasks/search`, {
          query: { ...common, is_blocked: true },
          all: asBool(args.all, false),
          limit: asInt(args.limit, 100),
        });
      } catch (e) {
        blocked_error = e;
      }

      try {
        blocking = await paginateGet(`/workspaces/${workspace}/tasks/search`, {
          query: { ...common, is_blocking: true },
          all: asBool(args.all, false),
          limit: asInt(args.limit, 100),
        });
      } catch (e) {
        blocking_error = e;
      }

      emit({
        project_gid: project,
        workspace_gid: workspace,
        blocked: blocked,
        blocking: blocking,
        blocked_error: blocked_error ? (blocked_error.details || { message: blocked_error.message || String(blocked_error) }) : null,
        blocking_error: blocking_error ? (blocking_error.details || { message: blocking_error.message || String(blocking_error) }) : null,
      });
      return;
    }

    /** ------------------------------------------------------------------ */
    /** Status updates                                                        */
    /** ------------------------------------------------------------------ */

    case "status-updates": {
      const parent = args.parent;
      if (!parent) die("Usage: status-updates --parent <project_gid|portfolio_gid|goal_gid> [--created_since <iso>] [--all]");
      const all = asBool(args.all, false);
      const limit = asInt(args.limit, 50);
      const statuses = await paginateGet("/status_updates", {
        query: {
          parent,
          created_since: args.created_since,
          opt_fields: args.opt_fields || "gid,title,status_type,text,created_at,author.name,parent.gid,parent.name",
        },
        all,
        limit,
      });
      emit({ data: statuses });
      return;
    }

    case "status-update": {
      const gid = args._[1];
      if (!gid) die("Usage: status-update <status_update_gid>");
      const res = await request("GET", `/status_updates/${gid}`, {
        query: { opt_fields: args.opt_fields || "gid,title,status_type,text,html_text,created_at,author.name,parent.gid,parent.name,uri" },
      });
      emit(res);
      return;
    }

    case "create-status-update": {
      const parent = args.parent;
      const status_type = args.status_type;
      const text = args.text;

      if (!parent || !status_type || !text) {
        die(
          'Usage: create-status-update --parent <gid> --status_type on_track|at_risk|off_track|on_hold|complete|achieved|partial|missed|dropped --text "..." [--title "..."]'
        );
      }

      const data = { parent, status_type, text };
      if (args.title !== undefined) data.title = args.title;
      if (args.html_text !== undefined) data.html_text = args.html_text;

      const res = await request("POST", "/status_updates", {
        body: { data },
        query: { opt_fields: args.opt_fields || "gid,title,status_type,text,created_at,parent.gid,parent.name" },
      });
      emit(res);
      return;
    }

    case "delete-status-update": {
      const gid = args._[1];
      if (!gid) die("Usage: delete-status-update <status_update_gid>");
      const res = await request("DELETE", `/status_updates/${gid}`);
      emit(res);
      return;
    }

    /** ------------------------------------------------------------------ */
    /** Activity / events (incremental change feed)                          */
    /** ------------------------------------------------------------------ */

    case "events": {
      const resource = args.resource || args._[1];
      if (!resource) {
        die("Usage: events --resource <gid> [--reset true|false] [--max_pages 5] [--no_save true|false]");
      }

      const reset = asBool(args.reset, false);
      const noSave = asBool(args.no_save, false);
      const maxPages = Math.max(1, asInt(args.max_pages, 5));

      const opt_fields =
        args.opt_fields ||
        "action,created_at,type,resource.gid,resource.resource_type,resource.name,user.gid,user.name,parent.gid,parent.name,change.field,change.action,change.new_value,change.added_value,change.removed_value";

      if (!cfg.event_sync_tokens || typeof cfg.event_sync_tokens !== "object") cfg.event_sync_tokens = {};

      let sync = args.sync !== undefined ? String(args.sync) : null;
      if (!sync && !reset) {
        const saved = cfg.event_sync_tokens[resource];
        if (saved) sync = String(saved);
      }

      const events = [];
      let hasMore = false;
      let pages = 0;
      let currentSync = sync;

      while (pages < maxPages) {
        pages += 1;
        try {
          const res = await request("GET", "/events", {
            query: { resource, sync: currentSync, opt_fields },
          });

          const batch = Array.isArray(res?.data) ? res.data : [];
          events.push(...batch);
          hasMore = Boolean(res?.has_more);
          currentSync = res?.sync || currentSync;

          if (!hasMore) break;
        } catch (e) {
          if (e instanceof AsanaApiError && e.details?.status === 412) {
            const newSync = e.details?.response?.sync || null;
            if (newSync && !noSave) {
              cfg.event_sync_tokens[resource] = newSync;
              saveConfig(cfg);
            }

            emit({
              resource,
              initialized: !sync,
              reset: true,
              sync: newSync,
              errors: e.details?.response?.errors || null,
              message:
                "Event sync token was missing or expired (412). You typically need to refresh the full dataset for the resource, then poll again using the new sync token.",
            });
            return;
          }
          throw e;
        }
      }

      if (!noSave && currentSync) {
        cfg.event_sync_tokens[resource] = currentSync;
        saveConfig(cfg);
      }

      emit({
        resource,
        events,
        sync: currentSync || null,
        has_more: hasMore,
        pages,
        stored: !noSave,
      });
      return;
    }

    case "clear-events-sync": {
      const resource = args.resource || args._[1];
      if (!resource) die("Usage: clear-events-sync --resource <gid>");
      if (cfg.event_sync_tokens && typeof cfg.event_sync_tokens === "object") {
        delete cfg.event_sync_tokens[resource];
        saveConfig(cfg);
      }
      emit({ ok: true, resource, cleared: true });
      return;
    }

    /** ------------------------------------------------------------------ */
    /** Timeline shifting                                                     */
    /** ------------------------------------------------------------------ */

    case "shift-task-dates": {
      const taskGid = args._[1];
      if (!taskGid) die("Usage: shift-task-dates <task_gid> --delta_days <int> [--dry_run true|false] [--include_subtasks true|false]");
      const deltaDays = asInt(args.delta_days);
      if (deltaDays === undefined) die("shift-task-dates requires --delta_days <int>");

      const dryRun = asBool(args.dry_run, false);
      const includeSubtasks = asBool(args.include_subtasks, false);

      const taskRes = await request("GET", `/tasks/${taskGid}`, {
        query: { opt_fields: "gid,name,start_on,start_at,due_on,due_at,permalink_url,completed" },
      });
      const task = taskRes?.data;

      if (!task) die("Task not found.");

      const change = computeShiftForTask(task, deltaDays);
      const changes = [change];

      if (includeSubtasks) {
        const subtasks = await paginateGet(`/tasks/${taskGid}/subtasks`, {
          query: { opt_fields: "gid,name,start_on,start_at,due_on,due_at,permalink_url,completed" },
          all: true,
          limit: 100,
        });

        for (const st of subtasks) {
          changes.push(computeShiftForTask(st, deltaDays));
        }
      }

      if (dryRun) {
        emit({ dry_run: true, delta_days: deltaDays, changes });
        return;
      }

      // Apply changes using batch (up to 10 actions/request).
      const toUpdate = changes.filter((c) => c.update && Object.keys(c.update).length > 0);
      const results = await batchUpdateTasks(toUpdate);
      emit({ dry_run: false, delta_days: deltaDays, updated: results });
      return;
    }

    case "shift-project-tasks": {
      const project = resolveProjectGid(args, cfg, { required: true });
      const deltaDays = asInt(args.delta_days);
      if (deltaDays === undefined) die("shift-project-tasks requires --delta_days <int>");

      const dryRun = asBool(args.dry_run, false);
      const includeCompleted = asBool(args.include_completed, false);
      const all = asBool(args.all, false);
      const limit = asInt(args.limit, 100);

      const tasks = await paginateGet("/tasks", {
        query: {
          project,
          completed_since: includeCompleted ? "1970-01-01T00:00:00.000Z" : "now",
          opt_fields: "gid,name,completed,start_on,start_at,due_on,due_at,permalink_url",
        },
        all,
        limit,
      });

      const changes = tasks.map((t) => computeShiftForTask(t, deltaDays));

      if (dryRun) {
        emit({ dry_run: true, project_gid: project, delta_days: deltaDays, changes });
        return;
      }

      const toUpdate = changes.filter((c) => c.update && Object.keys(c.update).length > 0);
      const results = await batchUpdateTasks(toUpdate);
      emit({ dry_run: false, project_gid: project, delta_days: deltaDays, updated: results });
      return;
    }

    /** ------------------------------------------------------------------ */
    /** Project dashboard (computed)                                          */
    /** ------------------------------------------------------------------ */

    case "project-dashboard": {
      const project = resolveProjectGid(args, cfg, { required: true });
      const dueWithinDays = asInt(args.due_within_days, 7);
      const includeCompleted = asBool(args.include_completed, false);
      const all = asBool(args.all, false);
      const limit = asInt(args.limit, 100);

      // Workspace can be provided explicitly, otherwise fetch from project.
      let workspace = args.workspace ? String(args.workspace) : null;
      let projectMeta = null;
      if (!workspace) {
        const projRes = await request("GET", `/projects/${project}`, {
          query: {
            opt_fields:
              "gid,name,permalink_url,workspace.gid,workspace.name,current_status_update.gid,current_status_update.title,current_status_update.status_type,current_status_update.created_at",
          },
        });
        projectMeta = projRes?.data || null;
        workspace = projectMeta?.workspace?.gid ? String(projectMeta.workspace.gid) : null;
      } else {
        const projRes = await request("GET", `/projects/${project}`, {
          query: { opt_fields: "gid,name,permalink_url" },
        });
        projectMeta = projRes?.data || null;
      }
      if (!workspace) die("Unable to resolve workspace for project. Pass --workspace explicitly.");

      const tasks = await paginateGet("/tasks", {
        query: {
          project,
          completed_since: includeCompleted ? "1970-01-01T00:00:00.000Z" : "now",
          opt_fields:
            "gid,name,completed,assignee.gid,assignee.name,start_on,start_at,due_on,due_at,resource_subtype,permalink_url,modified_at",
        },
        all,
        limit,
      });

      const now = new Date();
      const today = now.toISOString().slice(0, 10); // UTC date
      const dueCutoff = new Date(now.getTime() + dueWithinDays * 24 * 60 * 60 * 1000);
      const dueCutoffDate = dueCutoff.toISOString().slice(0, 10);

      const metrics = {
        total: tasks.length,
        completed: tasks.filter((t) => t.completed).length,
        incomplete: tasks.filter((t) => !t.completed).length,
        milestones: tasks.filter((t) => t.resource_subtype === "milestone").length,
      };

      const overdue = [];
      const dueSoon = [];
      const noDueDate = [];
      const unassigned = [];

      for (const t of tasks) {
        if (t.completed) continue;

        const hasAssignee = !!t.assignee;
        if (!hasAssignee) unassigned.push(t);

        const dueOn = t.due_on ? String(t.due_on) : null;
        const dueAt = t.due_at ? String(t.due_at) : null;

        if (!dueOn && !dueAt) {
          noDueDate.push(t);
          continue;
        }

        if (dueOn) {
          if (dueOn < today) overdue.push(t);
          else if (dueOn >= today && dueOn <= dueCutoffDate) dueSoon.push(t);
        } else if (dueAt) {
          const dueAtDt = new Date(dueAt);
          if (!Number.isNaN(dueAtDt.getTime())) {
            if (dueAtDt.getTime() < now.getTime()) overdue.push(t);
            else if (dueAtDt.getTime() <= dueCutoff.getTime()) dueSoon.push(t);
          }
        }
      }

      // Blockers via search endpoint (best-effort).
      let blocked = null;
      let blocking = null;
      let blockers_error = null;

      try {
        blocked = await paginateGet(`/workspaces/${workspace}/tasks/search`, {
          query: {
            "projects.any": project,
            completed: false,
            is_blocked: true,
            opt_fields: "gid,name,assignee.name,due_on,due_at,permalink_url",
          },
          all: false,
          limit: 100,
        });
        blocking = await paginateGet(`/workspaces/${workspace}/tasks/search`, {
          query: {
            "projects.any": project,
            completed: false,
            is_blocking: true,
            opt_fields: "gid,name,assignee.name,due_on,due_at,permalink_url",
          },
          all: false,
          limit: 100,
        });
      } catch (e) {
        blockers_error = e && typeof e === "object" && "details" in e ? e.details : { message: e?.message || String(e) };
      }

      emit({
        project: projectMeta ? { gid: projectMeta.gid, name: projectMeta.name, permalink_url: projectMeta.permalink_url } : { gid: project },
        workspace: { gid: workspace },
        as_of_utc: now.toISOString(),
        due_within_days: dueWithinDays,
        metrics: {
          ...metrics,
          overdue: overdue.length,
          due_soon: dueSoon.length,
          no_due_date: noDueDate.length,
          unassigned: unassigned.length,
          blocked: blocked ? blocked.length : null,
          blocking: blocking ? blocking.length : null,
        },
        lists: {
          overdue: overdue.slice(0, 25),
          due_soon: dueSoon.slice(0, 25),
          no_due_date: noDueDate.slice(0, 25),
          unassigned: unassigned.slice(0, 25),
          blocked: blocked ? blocked.slice(0, 25) : null,
          blocking: blocking ? blocking.slice(0, 25) : null,
        },
        blockers_error,
      });
      return;
    }

    default:
      die(`Unknown command: ${cmd}`);
  }
}

/** -------------------------------------------------------------------------- */
/** Bulk update helpers                                                        */
/** -------------------------------------------------------------------------- */

function computeShiftForTask(task, deltaDays) {
  const update = {};
  const start_on = task.start_on ?? null;
  const due_on = task.due_on ?? null;
  const start_at = task.start_at ?? null;
  const due_at = task.due_at ?? null;

  if (start_on) {
    const shifted = shiftDateOnly(start_on, deltaDays);
    if (shifted) update.start_on = shifted;
  }
  if (due_on) {
    const shifted = shiftDateOnly(due_on, deltaDays);
    if (shifted) update.due_on = shifted;
  }
  if (start_at) {
    const shifted = shiftDateTime(start_at, deltaDays);
    if (shifted) update.start_at = shifted;
  }
  if (due_at) {
    const shifted = shiftDateTime(due_at, deltaDays);
    if (shifted) update.due_at = shifted;
  }

  // If the task uses date-only fields, avoid mixing with datetime fields.
  // Keep the same field type you started with.
  if (start_on && update.start_at) delete update.start_at;
  if (due_on && update.due_at) delete update.due_at;

  return {
    gid: task.gid,
    name: task.name,
    permalink_url: task.permalink_url,
    original: { start_on, start_at, due_on, due_at },
    update,
  };
}

async function batchUpdateTasks(changes) {
  const MAX_ACTIONS = 10;
  const results = [];

  for (let i = 0; i < changes.length; i += MAX_ACTIONS) {
    const slice = changes.slice(i, i + MAX_ACTIONS);
    const actions = slice.map((c) => ({
      method: "put",
      relative_path: `/tasks/${c.gid}`,
      data: c.update,
    }));

    const resp = await request("POST", "/batch", { body: { data: { actions } } });

    const batchResults = resp?.data;
    if (Array.isArray(batchResults)) {
      for (let j = 0; j < batchResults.length; j++) {
        const r = batchResults[j];
        const originalChange = slice[j];
        results.push({
          gid: originalChange.gid,
          name: originalChange.name,
          status_code: r.status_code,
          body: r.body,
        });
      }
    } else {
      results.push({ error: "Unexpected batch response format", response: resp });
    }
  }

  return results;
}

main().catch((e) => {
  if (e && typeof e === "object" && "details" in e) {
    die(e.message || "Unhandled error", e.details);
  }
  die("Unhandled error", { message: String(e), stack: e?.stack });
});
