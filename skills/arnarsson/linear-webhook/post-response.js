#!/usr/bin/env node
/**
 * Linear Response Poster
 * 
 * Checks for completed agent sessions and posts responses back to Linear.
 * Can be run as a cron job or triggered after webhook completes.
 * 
 * Usage:
 *   node post-response.js [sessionKey]
 *   
 * Environment:
 *   LINEAR_API_KEY or CLAWDBOT_LINEAR_API_KEY required
 */

const { postLinearComment } = require('./linear-transform.js');

/**
 * Get session history from Clawdbot
 * 
 * @param {string} sessionKey - Session key to fetch
 * @returns {Promise<Object>} - Session data with messages
 */
async function getSessionHistory(sessionKey) {
  // This would use Clawdbot API or session logs
  // For now, placeholder that reads from sessions_send or logs
  
  // Example: Use clawdbot CLI
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  try {
    const { stdout } = await execAsync(`clawdbot sessions history ${sessionKey} --json`);
    return JSON.parse(stdout);
  } catch (error) {
    console.error('Failed to fetch session history:', error.message);
    return null;
  }
}

/**
 * Extract agent response from session history
 * 
 * @param {Object} session - Session history
 * @returns {string|null} - Last agent message or null
 */
function extractAgentResponse(session) {
  if (!session || !session.messages) {
    return null;
  }
  
  // Find last assistant message
  const messages = session.messages.filter(m => m.role === 'assistant');
  
  if (messages.length === 0) {
    return null;
  }
  
  const lastMessage = messages[messages.length - 1];
  return lastMessage.content;
}

/**
 * Main execution
 */
async function main() {
  const sessionKey = process.argv[2];
  
  if (!sessionKey) {
    console.error('Usage: node post-response.js <sessionKey>');
    console.error('Example: node post-response.js linear:mason:issue-123');
    process.exit(1);
  }
  
  // Extract metadata from session key
  const match = sessionKey.match(/^linear:(\w+):(.+)$/);
  
  if (!match) {
    console.error('Invalid session key format. Expected: linear:agent:issueId');
    process.exit(1);
  }
  
  const [, agentName, issueId] = match;
  
  console.log(`Fetching session: ${sessionKey}`);
  const session = await getSessionHistory(sessionKey);
  
  if (!session) {
    console.error('Failed to fetch session');
    process.exit(1);
  }
  
  console.log(`Extracting agent response...`);
  const response = extractAgentResponse(session);
  
  if (!response) {
    console.error('No agent response found in session');
    process.exit(1);
  }
  
  console.log(`Agent response (${response.length} chars):`);
  console.log(response.slice(0, 200) + '...');
  console.log('');
  
  // Get agent display name
  const AGENT_NAMES = {
    'mason': 'Mason (Clawdbot)',
    'eureka': 'Eureka (Clawdbot)',
  };
  
  const agentDisplayName = AGENT_NAMES[agentName] || agentName;
  
  console.log(`Posting to Linear issue: ${issueId}`);
  await postLinearComment(issueId, response, agentDisplayName);
  
  console.log('Done!');
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = { getSessionHistory, extractAgentResponse };
