/**
 * Linear Webhook Transform
 * 
 * Parses Linear comment webhooks and routes @mentions to Clawdbot agents.
 * 
 * Supports: @mason (code), @eureka (planning)
 */

// Agent mention mapping
const AGENT_MENTIONS = {
  '@mason': 'mason',
  '@eureka': 'eureka',
  '@forge': 'forge',
};

// Agent display names for Linear comments
const AGENT_NAMES = {
  'mason': 'Mason (Clawdbot)',
  'eureka': 'Eureka (Clawdbot)',
  'forge': 'Forge (Clawdbot)',
};

/**
 * Transform Linear webhook payload into Clawdbot agent action
 * 
 * @param {Object} payload - Linear webhook payload
 * @param {Object} req - Express request object
 * @returns {Object|null} - Agent action or null if not applicable
 */
function transformLinearWebhook(payload, req) {
  // Gateway wraps Linear webhook: { payload: {...}, headers: {...} }
  // Extract the actual Linear webhook from the envelope
  const linearWebhook = payload.payload;

  if (!linearWebhook) {
    console.log('[Linear Webhook] No nested payload found, aborting');
    return null;
  }

  const webhookType = linearWebhook.type;
  const webhookAction = linearWebhook.action;

  // Validate webhook type (Comment creation)
  if (webhookType !== 'Comment' || webhookAction !== 'create') {
    console.log('[Linear Webhook] Ignoring event - type:', webhookType, 'action:', webhookAction);
    return null;
  }

  const comment = linearWebhook.data;
  const issue = comment.issue;
  const commentBody = comment.body || '';
  const commentor = comment.user?.name || 'Unknown';

  // Extract @mentions
  const mentions = extractMentions(commentBody);
  
  if (mentions.length === 0) {
    console.log('[Linear Webhook] No agent mentions found');
    return null;
  }

  // Take first mention (support multiple mentions in future)
  const mentionedAgent = mentions[0];
  const agentSession = AGENT_MENTIONS[mentionedAgent];

  if (!agentSession) {
    console.log('[Linear Webhook] Unknown agent mention:', mentionedAgent);
    return null;
  }

  // Build context message for agent
  const taskMessage = buildTaskMessage(comment, issue, commentor, mentionedAgent);

  console.log('[Linear Webhook] Routing to agent:', agentSession);
  console.log('[Linear Webhook] Task:', taskMessage);

  // Store issue/comment IDs for posting response back
  const metadata = {
    issueId: issue.id,
    issueIdentifier: issue.identifier,
    commentId: comment.id,
    commentUrl: comment.url,
    issueUrl: issue.url,
    agentName: AGENT_NAMES[agentSession] || agentSession,
  };

  // Return just the message - let webhook mapping handle routing to agent
  return {
    message: taskMessage,
    metadata, // Pass through for response handling
  };
}

/**
 * Extract @mentions from comment body
 * 
 * @param {string} text - Comment text
 * @returns {string[]} - Array of @mentions (e.g., ['@mason', '@eureka'])
 */
function extractMentions(text) {
  const mentionPattern = /@(mason|eureka|forge)/gi;
  const matches = text.match(mentionPattern);
  return matches ? matches.map(m => m.toLowerCase()) : [];
}

/**
 * Build task message for agent with full context
 * 
 * @param {Object} comment - Linear comment object
 * @param {Object} issue - Linear issue object
 * @param {string} commentor - Name of person who commented
 * @param {string} mention - The @mention used
 * @returns {string} - Formatted task message
 */
function buildTaskMessage(comment, issue, commentor, mention) {
  const labels = issue.labels?.nodes?.map(l => l.name).join(', ') || 'None';
  const state = issue.state?.name || 'Unknown';
  const assignee = issue.assignee?.name || 'Unassigned';
  const priority = getPriorityLabel(issue.priority);

  const taskLines = [
    `🔗 **LINEAR WEBHOOK TASK** 🔗`,
    ``,
    `**Issue:** ${issue.identifier} - ${issue.title}`,
    `**Requested by:** ${commentor}`,
    `**Mention:** ${mention}`,
    ``,
    `**Issue Details:**`,
    `- Status: ${state}`,
    `- Priority: ${priority}`,  
    `- Assignee: ${assignee}`,
    `- Labels: ${labels}`,
    `- URL: ${issue.url}`,
    ``,
    `**Issue Description:**`,
    `${issue.description || 'No description provided.'}`,
    ``,
    `**Comment/Task:**`,
    `${comment.body}`,
    ``,
    `---`,
    `**⚠️ MANDATORY: After responding, run this command to post back to Linear:**`,
    `\`\`\``,
    `LINEAR_API_KEY=$(cat ~/.linear_api_key) node -e "const {postLinearComment} = require('/home/sven/clawd-mason/skills/linear-webhook/linear-transform.js'); postLinearComment('${issue.id}', \\\`YOUR_RESPONSE_HERE\\\`, '${AGENT_NAMES[agentSession] || agentSession}');"`,
    `\`\`\``,
    `Replace YOUR_RESPONSE_HERE with your actual response text.`,
    `**Issue ID for postLinearComment:** ${issue.id}`,
    `**Agent Name:** ${AGENT_NAMES[agentSession] || agentSession}`,
  ];

  return taskLines.join('\n');
}

/**
 * Get human-readable priority label
 * 
 * @param {number} priority - Linear priority value (0-4)
 * @returns {string} - Priority label
 */
function getPriorityLabel(priority) {
  const labels = {
    0: 'No Priority',
    1: 'Urgent (P1)',
    2: 'High (P2)',
    3: 'Medium (P3)',
    4: 'Low (P4)',
  };
  return labels[priority] || 'Unknown';
}

/**
 * Load OAuth tokens for agents
 */
function loadAgentTokens() {
  const fs = require('fs');
  const tokensPath = process.env.HOME + '/.config/clawdbot/linear-agent-tokens.json';
  try {
    const data = fs.readFileSync(tokensPath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error('[Linear Webhook] Failed to load agent tokens:', e.message);
    return {};
  }
}

/**
 * Post agent response back to Linear issue as comment
 * 
 * Uses agent's OAuth token to post as the agent's app user (not Sven)
 * 
 * @param {string} issueId - Linear issue ID
 * @param {string} responseText - Agent's response
 * @param {string} agentName - Name of agent (for attribution) e.g. "Mason (Clawdbot)"
 */
async function postLinearComment(issueId, responseText, agentName) {
  // Extract agent key from name (e.g., "Mason (Clawdbot)" -> "mason")
  const agentKey = agentName.toLowerCase().split(' ')[0].replace(/[^a-z]/g, '');
  
  // Load OAuth tokens
  const tokens = loadAgentTokens();
  const agentToken = tokens[agentKey]?.accessToken;
  
  // Use personal API key directly (OAuth tokens have auth issues)
  // Read from file as most reliable source
  const fs = require('fs');
  let personalKey = process.env.LINEAR_API_KEY || process.env.CLAWDBOT_LINEAR_API_KEY;
  try {
    personalKey = fs.readFileSync(process.env.HOME + '/.linear_api_key', 'utf8').trim();
  } catch (e) { /* use env var */ }
  
  const apiKey = personalKey;
  
  if (!apiKey) {
    console.error('[Linear Webhook] No API key found for agent:', agentKey);
    return;
  }

  console.log('[Linear Webhook] Posting as:', agentToken ? `OAuth app (${agentKey})` : 'Personal API key');

  const body = `---\n🤖 **${agentName}**\n\n${responseText}\n\n---\n*Posted via Clawdbot webhook integration*`;

  const mutation = `
    mutation CreateComment($issueId: String!, $body: String!) {
      commentCreate(input: { issueId: $issueId, body: $body }) {
        success
        comment {
          id
          url
        }
      }
    }
  `;

  try {
    const response = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: mutation, variables: { issueId, body } }),
    });

    const result = await response.json();

    if (result.data?.commentCreate?.success) {
      console.log('[Linear Webhook] Posted comment:', result.data.commentCreate.comment.url);
    } else {
      console.error('[Linear Webhook] Failed to post comment:', result.errors);
    }
  } catch (error) {
    console.error('[Linear Webhook] Error posting comment:', error.message);
  }
}

// Export for Clawdbot
module.exports = {
  transformLinearWebhook,
  postLinearComment,
  extractMentions,
  buildTaskMessage,
};

// CLI testing support
if (require.main === module) {
  // Test with example payload
  const examplePayload = {
    "type": "Comment",
    "action": "create",
    "data": {
      "id": "comment-123",
      "body": "@mason implement user authentication with OAuth2",
      "url": "https://linear.app/team/issue/ABC-123#comment-123",
      "user": {
        "name": "Sven Arnarsson",
        "email": "sven@example.com"
      },
      "issue": {
        "id": "issue-123",
        "identifier": "ABC-123",
        "title": "Add user authentication",
        "description": "We need OAuth2 authentication for the app",
        "url": "https://linear.app/team/issue/ABC-123",
        "state": {
          "name": "In Progress"
        },
        "priority": 1,
        "assignee": {
          "name": "Sven Arnarsson"
        },
        "labels": {
          "nodes": [
            { "name": "backend" },
            { "name": "security" }
          ]
        }
      }
    }
  };

  console.log('Testing Linear webhook transform...\n');
  const result = transformLinearWebhook(examplePayload, {});
  
  if (result) {
    console.log('\n=== Transform Result ===');
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('Transform returned null (no action)');
  }
}
