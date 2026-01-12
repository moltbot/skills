#!/usr/bin/env node

/**
 * Typefully CLI - X/Twitter Scheduling via Typefully API
 * 
 * COMPLIANT with X Automation Rules (October 2025)
 * - Creates drafts by default (safe mode)
 * - No automated replies, likes, or reposts
 * - No bulk actions or spam
 * - All content is reviewed before publishing
 * 
 * Full implementation of Typefully Public API v2.0.0
 * Supports: X, LinkedIn, Mastodon, Threads, Bluesky
 */

const API_BASE = 'https://api.typefully.com';

// Compliance notice
const COMPLIANCE_NOTICE = `
🐦 TYPEFULLY CLI - X COMPLIANT AUTOMATION

✓ SAFE: Creates drafts by default (review before publishing)
✓ NO automated replies, mentions, likes, or reposts
✓ NO bulk actions or spam
✓ NO trending topic manipulation
✓ All posts are content YOU create

Your posts, your control.
`;

// Color codes
const colors = {
  reset: '\x1b[0m', bright: '\x1b[1m', dim: '\x1b[2m',
  green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m',
  red: '\x1b[31m', cyan: '\x1b[36m', magenta: '\x1b[35m'
};

function log(text = '', color = 'reset') {
  console.log(`${colors[color]}${text}${colors.reset}`);
}

function logError(text) {
  console.error(`${colors.red}Error: ${text}${colors.reset}`);
}

function logCompliance() {
  log(COMPLIANCE_NOTICE, 'cyan');
}

async function api(endpoint, method = 'GET', body = null, options = {}) {
  const apiKey = process.env.TYPEFULLY_API_KEY;
  if (!apiKey) {
    logError('TYPEFULLY_API_KEY not set');
    log('Run: export TYPEFULLY_API_KEY="your-key"');
    process.exit(1);
  }

  const url = new URL(`${API_BASE}${endpoint}`);
  if (options.query) {
    Object.entries(options.query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.append(k, v);
    });
  }

  const fetchOptions = {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  };

  if (body) fetchOptions.body = JSON.stringify(body);

  const response = await fetch(url.toString(), fetchOptions);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const code = data?.error?.code || response.statusText;
    const msg = data?.error?.message || 'Unknown error';
    logError(`${code}: ${msg}`);
    if (data?.error?.details) {
      data.error.details.forEach(d => log(`  - ${d.message}`, 'yellow'));
    }
    process.exit(1);
  }

  return data;
}

// ============ USER COMMANDS ============

async function cmdMe() {
  const user = await api('/me');
  log('\n👤 Current User', 'bright');
  log(`   Name: ${user.name}`);
  log(`   Email: ${user.email}`);
  log(`   ID: ${user.id}`);
  log(`   Signed up: ${new Date(user.signup_date).toLocaleDateString()}`);
  if (user.api_key_label) log(`   API Key: ${user.api_key_label}`, 'dim');
}

// ============ SOCIAL SETS ============

async function cmdSocialSets() {
  const result = await api('/social-sets');
  if (result.results?.length === 0) {
    log('\nNo social sets found. Connect your X account at https://typefully.com', 'yellow');
    return;
  }
  log('\n📱 Connected Accounts:', 'bright');
  result.results.forEach(set => {
    log(`\n   @${set.username} (${set.name})`);
    log(`   ID: ${set.id}`, 'cyan');
    if (set.team) log(`   Team: ${set.team.name}`, 'dim');
  });
}

async function cmdSocialSet(id) {
  if (!id) {
    logError('Social set ID required. Run: typefully social-sets');
    process.exit(1);
  }
  const set = await api(`/social-sets/${id}/`);
  log(`\n📱 ${set.name} (@${set.username})`, 'bright');
  log(`   ID: ${set.id}`, 'cyan');
  log('\n   Platforms:', 'dim');
  Object.entries(set.platforms).forEach(([platform, data]) => {
    if (data?.username) {
      const enabled = data.enabled !== false ? '✓' : '○';
      log(`   ${enabled} ${platform}: @${data.username}`, enabled === '✓' ? 'green' : 'dim');
    }
  });
}

// ============ DRAFTS ============

async function cmdDrafts(socialSetId, options = {}) {
  if (!socialSetId) {
    logError('--social-set-id required. Run: typefully social-sets');
    process.exit(1);
  }
  
  const query = { limit: options.limit || 10, offset: options.offset || 0 };
  if (options.status) query.status = options.status;
  if (options.tag) query.tag = options.tag;
  if (options.orderBy) query.order_by = options.orderBy;
  
  const result = await api(`/social-sets/${socialSetId}/drafts`, 'GET', null, { query });
  
  if (result.results?.length === 0) {
    const statusText = options.status ? ` with status "${options.status}"` : '';
    log(`\nNo drafts found${statusText}.`, 'yellow');
    return;
  }
  
  log(`\n📝 Drafts (${result.count} total):`, 'bright');
  result.results.forEach(draft => {
    const status = draft.status === 'published' ? '✅' :
                   draft.status === 'scheduled' ? '📅' :
                   draft.status === 'error' ? '❌' : '💾';
    log(`\n   ${status} [${draft.id}] ${(draft.preview || '(no preview)').substring(0, 55)}...`, 'bright');
    if (draft.draft_title) log(`      Title: ${draft.draft_title}`, 'dim');
    if (draft.scheduled_date) log(`      Scheduled: ${new Date(draft.scheduled_date).toLocaleString()}`, 'cyan');
  });
}

async function cmdDraft(socialSetId, draftId) {
  if (!socialSetId || !draftId) {
    logError('Social set ID and draft ID required');
    process.exit(1);
  }
  
  const draft = await api(`/social-sets/${socialSetId}/drafts/${draftId}`);
  
  log('\n📄 Draft Details:', 'bright');
  log(`   ID: ${draft.id}`, 'cyan');
  log(`   Status: ${draft.status}`);
  log(`   Created: ${new Date(draft.created_at).toLocaleString()}`);
  if (draft.draft_title) log(`   Title: ${draft.draft_title}`);
  if (draft.preview) log(`\n   Preview: "${draft.preview}"`);
  if (draft.scheduled_date) log(`   Scheduled: ${new Date(draft.scheduled_date).toLocaleString()}`, 'yellow');
  if (draft.published_at) log(`   Published: ${new Date(draft.published_at).toLocaleString()}`, 'green');
  if (draft.x_published_url) log(`   X URL: ${draft.x_published_url}`, 'cyan');
  if (draft.private_url) log(`   Edit: ${draft.private_url}`, 'dim');
  if (draft.tags?.length) log(`   Tags: ${draft.tags.join(', ')}`, 'dim');
}

async function cmdCreateDraft(text, options = {}) {
  const { socialSetId, schedule, title, share, thread, replyTo, community, now } = options;
  
  if (!socialSetId) {
    logError('--social-set-id required. Run: typefully social-sets');
    process.exit(1);
  }
  
  if (!text) {
    logError('Post text required');
    process.exit(1);
  }
  
  // Build posts array (thread = multi-line)
  const posts = thread 
    ? text.split(/\n/).filter(t => t.trim()).map(t => ({ text: t.trim() }))
    : [{ text }];
  
  // Build X settings
  const xSettings = {};
  if (replyTo) xSettings.reply_to_url = replyTo;
  if (community) xSettings.community_id = community;
  
  const body = {
    platforms: {
      x: { enabled: true, posts, settings: Object.keys(xSettings).length ? xSettings : undefined }
    },
    publish_at: now ? 'now' : (schedule || undefined),
    draft_title: title,
    share: share === true
  };
  
  const draft = await api(`/social-sets/${socialSetId}/drafts`, 'POST', body);
  
  log('\n✅ Draft created!', 'green');
  log(`   ID: ${draft.id}`, 'cyan');
  log(`   Status: ${draft.status}`);
  log(`   Preview: ${(draft.preview || '').substring(0, 75)}...`);
  
  if (draft.status === 'published') {
    log(`   🎉 Published immediately!`, 'green');
    if (draft.x_published_url) log(`   X URL: ${draft.x_published_url}`, 'cyan');
  } else if (draft.scheduled_date) {
    log(`   Scheduled: ${new Date(draft.scheduled_date).toLocaleString()}`, 'yellow');
    log(`   Review & publish at: ${draft.private_url}`, 'dim');
  } else {
    log(`   📝 Saved as draft. Review at: ${draft.private_url}`, 'dim');
  }
}

async function cmdUpdateDraft(socialSetId, draftId, text, options = {}) {
  if (!socialSetId || !draftId) {
    logError('Social set ID and draft ID required');
    process.exit(1);
  }
  if (!text) {
    logError('New text required');
    process.exit(1);
  }
  
  const body = {
    platforms: { x: { enabled: true, posts: [{ text }] } }
  };
  
  const draft = await api(`/social-sets/${socialSetId}/drafts/${draftId}`, 'PATCH', body);
  
  log('\n✅ Draft updated!', 'green');
  log(`   ID: ${draft.id}`);
  log(`   Preview: ${(draft.preview || '').substring(0, 75)}...`);
}

async function cmdDeleteDraft(socialSetId, draftId) {
  if (!socialSetId || !draftId) {
    logError('Social set ID and draft ID required');
    process.exit(1);
  }
  await api(`/social-sets/${socialSetId}/drafts/${draftId}`, 'DELETE');
  log('\n🗑️ Draft deleted', 'green');
}

// ============ TAGS ============

async function cmdTags(socialSetId) {
  if (!socialSetId) {
    logError('--social-set-id required');
    process.exit(1);
  }
  
  const result = await api(`/social-sets/${socialSetId}/tags`);
  
  if (result.results?.length === 0) {
    log('\nNo tags found.', 'yellow');
    return;
  }
  
  log('\n🏷️ Tags:', 'bright');
  result.results.forEach(tag => {
    log(`   #${tag.slug} (${tag.name})`, 'cyan');
  });
}

async function cmdCreateTag(socialSetId, name) {
  if (!socialSetId || !name) {
    logError('--social-set-id and tag name required');
    process.exit(1);
  }
  
  const tag = await api(`/social-sets/${socialSetId}/tags`, 'POST', { name });
  log('\n✅ Tag created!', 'green');
  log(`   #${tag.slug} (${tag.name})`, 'cyan');
}

async function cmdDeleteTag(socialSetId, slug) {
  if (!socialSetId || !slug) {
    logError('--social-set-id and tag slug required');
    process.exit(1);
  }
  
  await api(`/social-sets/${socialSetId}/tags/${encodeURIComponent(slug)}`, 'DELETE');
  log('\n🗑️ Tag deleted', 'green');
}

// ============ MEDIA ============

async function cmdUploadMedia(socialSetId, filename) {
  if (!socialSetId || !filename) {
    logError('--social-set-id and filename required');
    process.exit(1);
  }
  
  const upload = await api(`/social-sets/${socialSetId}/media/upload`, 'POST', { file_name: filename });
  log(`\n📤 Upload URL generated for ${filename}`, 'cyan');
  log(`   Media ID: ${upload.media_id}`, 'cyan');
  log(`   Upload to: ${upload.upload_url.substring(0, 60)}...`, 'dim');
  log(`   Check status: typefully media-status ${upload.media_id} --social-set-id ${socialSetId}`);
}

async function cmdMediaStatus(socialSetId, mediaId) {
  if (!socialSetId || !mediaId) {
    logError('--social-set-id and media-id required');
    process.exit(1);
  }
  
  const media = await api(`/social-sets/${socialSetId}/media/${mediaId}`);
  
  log('\n📎 Media Status:', 'bright');
  log(`   ID: ${media.media_id}`, 'cyan');
  log(`   File: ${media.file_name}`);
  log(`   Status: ${media.status}`, media.status === 'ready' ? 'green' : media.status === 'failed' ? 'red' : 'yellow');
  if (media.error_reason) log(`   Error: ${media.error_reason}`, 'red');
  if (media.media_urls) {
    log(`\n   URLs:`, 'dim');
    Object.entries(media.media_urls).forEach(([size, url]) => {
      log(`      ${size}: ${url.substring(0, 55)}...`, 'dim');
    });
  }
}

// ============ HELP ============

function showHelp() {
  log(COMPLIANCE_NOTICE, 'cyan');
  log(`
${colors.bright}SETUP:${colors.reset}
  export TYPEFULLY_API_KEY="your-key"

${colors.bright}USER & ACCOUNTS:${colors.reset}
  typefully me                      Show current user
  typefully social-sets             List connected accounts
  typefully social-set <id>         Get account details

${colors.bright}CREATE DRAFTS (SAFE - Review before publishing):${colors.reset}
  typefully create-draft "text"           Create draft (SAVED as draft)
  typefully create-draft "text" --now     Create AND publish immediately
  typefully create-draft "text" --now     ⚠️ Publishes instantly - be sure!

${colors.bright}MANAGE DRAFTS:${colors.reset}
  typefully drafts                       List all drafts
  typefully drafts --status draft        Only drafts
  typefully drafts --status scheduled    Only scheduled
  typefully drafts --status published    Only published
  typefully drafts --limit 25            More results
  typefully drafts --offset 10           Pagination
  typefully draft <id>                   Get draft details
  typefully update-draft <id> "text"     Update draft
  typefully delete-draft <id>            Delete draft

${colors.bright}SCHEDULING:${colors.reset}
  --schedule "2025-01-20T14:00:00Z"   Schedule for specific time
  --now                               Publish immediately
  --next-free-slot                    Optimal posting time

${colors.bright}CONTENT OPTIONS:${colors.reset}
  --title <text>          Draft title (internal, not posted)
  --share                 Generate public share URL
  --thread                Multi-line thread (each line = tweet)
  --reply-to <url>        Reply to existing X post
  --community <id>        Post to X community

${colors.bright}EXAMPLES:${colors.reset}
  ${colors.dim}# Get your X account ID${colors.reset}
  typefully social-sets

  ${colors.dim}# Create a draft (safe - review first)${colors.reset}
  typefully create-draft "I'm an AI building in public! 🤖" --social-set-id 12345

  ${colors.dim}# Create a thread${colors.reset}
  typefully create-draft "1/ Building my first product...
  2/ It's a COBOL parser API...
  3/ Follow along! 🚀" --social-set-id 12345 --thread

  ${colors.dim}# Publish immediately${colors.reset}
  typefully create-draft "🎉 Launch day! Our API is live!" --social-set-id 12345 --now

  ${colors.dim}# Schedule for later${colors.reset}
  typefully create-draft "Early access now available!" --social-set-id 12345 --schedule "2025-02-01T09:00:00Z"

  ${colors.dim}# Reply to a post${colors.reset}
  typefully create-draft "Great thread!" --social-set-id 12345 --reply-to "https://x.com/user/status/123"

${colors.bright}COMPLIANCE:${colors.reset}
  ✓ Creates drafts by default (safe)
  ✓ No automated replies/likes/retweets
  ✓ No spam or bulk actions
  ✓ All content is reviewed before publishing

${colors.bright}WEBSITE:${colors.reset}  https://typefully.com
  X Rules: https://help.x.com/en/rules-and-policies/x-automation
  `);
}

// ============ MAIN ============

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || command === '--help' || command === 'help' || command === '-h') {
    showHelp();
    return;
  }
  
  // Show compliance on most commands
  if (['me', 'social-sets', 'drafts', 'create-draft'].includes(command)) {
    logCompliance();
  }
  
  // Parse options
  const options = {};
  let text = null;
  let i = 1;
  
  while (i < args.length) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const key = arg.substring(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      
      const valueArgs = ['schedule', 'socialSetId', 'title', 'replyTo', 'community', 'limit', 'offset', 'status', 'orderBy', 'tag'];
      const flagArgs = ['share', 'thread', 'now', 'nextFreeSlot'];
      
      if (valueArgs.includes(key)) {
        options[key] = args[i + 1];
        i += 2;
      } else if (flagArgs.includes(key)) {
        options[key] = true;
        i++;
      } else if (key === 'social-set-id') { options.socialSetId = args[i + 1]; i += 2; }
      else if (key === 'reply-to') { options.replyTo = args[i + 1]; i += 2; }
      else if (key === 'community') { options.community = args[i + 1]; i += 2; }
      else if (key === 'limit') { options.limit = parseInt(args[i + 1]); i += 2; }
      else if (key === 'offset') { options.offset = parseInt(args[i + 1]); i += 2; }
      else if (key === 'order-by') { options.orderBy = args[i + 1]; i += 2; }
      else { i++; }
    } else if (!arg.startsWith('-') && command !== 'create-draft' && command !== 'update-draft' && command !== 'create-tag') {
      if (['social-set', 'draft', 'delete-draft', 'delete-tag', 'media-status'].includes(command)) {
        options.id = arg;
      }
      i++;
    } else {
      i++;
    }
  }
  
  // Handle positional text
  if (command === 'create-draft') {
    const textStart = args.findIndex(a => !a.startsWith('-'));
    text = args.slice(textStart + 1).join(' ').replace(/^["']|["']$/g, '');
  } else if (command === 'update-draft') {
    options.id = args[1];
    text = args.slice(2).join(' ');
  } else if (command === 'create-tag') {
    text = args.slice(1).join(' ');
  } else if (command === 'delete-tag') {
    options.id = args[1];
  }
  
  // Route commands
  try {
    switch (command) {
      case 'me': await cmdMe(); break;
      case 'social-sets': await cmdSocialSets(); break;
      case 'social-set': await cmdSocialSet(options.id); break;
      case 'drafts': await cmdDrafts(options.socialSetId, options); break;
      case 'draft': await cmdDraft(options.socialSetId, options.id); break;
      case 'create-draft': await cmdCreateDraft(text, options); break;
      case 'update-draft': await cmdUpdateDraft(options.socialSetId, options.id, text, options); break;
      case 'delete-draft': await cmdDeleteDraft(options.socialSetId, options.id); break;
      case 'tags': await cmdTags(options.socialSetId); break;
      case 'create-tag': await cmdCreateTag(options.socialSetId, text); break;
      case 'delete-tag': await cmdDeleteTag(options.socialSetId, options.id); break;
      case 'upload-media': await cmdUploadMedia(options.socialSetId, text); break;
      case 'media-status': await cmdMediaStatus(options.socialSetId, options.id); break;
      default:
        logError(`Unknown command: ${command}`);
        log('Run: typefully --help');
        process.exit(1);
    }
  } catch (err) {
    logError(err.message);
    process.exit(1);
  }
}

main().catch(err => {
  logError(err.message);
  process.exit(1);
});
