"use strict";
/**
 * Plan2Meal ClawdHub Skill - Main Entry Point
 *
 * Handles incoming messages and routes them to appropriate command handlers.
 * Uses backend-based Device Flow for authentication - no configuration required.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialize = initialize;
exports.handleMessage = handleMessage;
exports.setUserToken = setUserToken;
exports.clearSession = clearSession;
exports.getSession = getSession;
exports.logout = logout;
exports.getCommandPatterns = getCommandPatterns;
const utils_1 = require("./utils");
const device_auth_1 = require("./device-auth");
const convex_1 = __importDefault(require("./convex"));
const commands_1 = __importDefault(require("./commands"));
let config = {
    apiUrl: process.env.PLAN2MEAL_API_URL || 'https://gallant-bass-875.convex.site',
};
// Initialize auth client
let authClient = null;
// Session storage
const sessionStore = new Map();
// Pending device flow authorizations
const pendingAuth = new Map();
/**
 * Initialize the skill with configuration
 */
function initialize(customConfig = {}) {
    config = { ...config, ...customConfig };
    authClient = new device_auth_1.DeviceAuth(config.apiUrl);
    return {
        name: 'plan2meal',
        version: '2.0.0',
        commands: getCommandPatterns(),
    };
}
/**
 * Get command patterns for skill registration
 */
function getCommandPatterns() {
    return [
        { pattern: /^plan2meal\s+login$/i, description: 'Login via GitHub' },
        { pattern: /^plan2meal\s+logout$/i, description: 'Logout' },
        { pattern: /^plan2meal\s+status$/i, description: 'Check auth status' },
        { pattern: /^plan2meal\s+whoami$/i, description: 'Show current user' },
        { pattern: /^plan2meal\s+add\s+(.+)$/i, description: 'Add recipe from URL' },
        { pattern: /^plan2meal\s+list$/i, description: 'List your recipes' },
        { pattern: /^plan2meal\s+search\s+(.+)$/i, description: 'Search recipes' },
        { pattern: /^plan2meal\s+show\s+(.+)$/i, description: 'Show recipe details' },
        { pattern: /^plan2meal\s+delete\s+(.+)$/i, description: 'Delete a recipe' },
        { pattern: /^plan2meal\s+lists$/i, description: 'List grocery lists' },
        { pattern: /^plan2meal\s+list-show\s+(.+)$/i, description: 'Show grocery list' },
        { pattern: /^plan2meal\s+list-create\s+(.+)$/i, description: 'Create grocery list' },
        { pattern: /^plan2meal\s+list-add\s+(\S+)\s+(\S+)$/i, description: 'Add recipe to list' },
        { pattern: /^plan2meal\s+help$/i, description: 'Show help' },
    ];
}
/**
 * Get Plan2Meal API client for a user
 */
function getApiClient(token) {
    return new convex_1.default(config.apiUrl, token);
}
/**
 * Get command handler
 */
function getCommands(token) {
    const apiClient = getApiClient(token);
    return new commands_1.default(apiClient, authClient, config);
}
/**
 * Handle incoming message
 */
async function handleMessage(message, context = { sessionId: 'default' }) {
    const { sessionId } = context;
    const text = message.trim();
    // Handle help without auth
    if (/^plan2meal\s+help$/i.test(text)) {
        return { text: getHelp() };
    }
    // Handle login command
    if (/^plan2meal\s+login$/i.test(text)) {
        return startLogin(sessionId);
    }
    // Handle logout command
    if (/^plan2meal\s+logout$/i.test(text)) {
        return logout(sessionId);
    }
    // Handle status command
    if (/^plan2meal\s+status$/i.test(text)) {
        return getStatus(sessionId);
    }
    // Handle whoami command
    if (/^plan2meal\s+whoami$/i.test(text)) {
        return whoami(sessionId);
    }
    // Check if there's a pending auth to complete
    const pending = pendingAuth.get(sessionId);
    if (pending) {
        return checkPendingAuth(sessionId);
    }
    // Get session and validate token
    const session = sessionStore.get(sessionId);
    if (!session?.tokens) {
        return {
            text: '🔐 You need to login first.\n\n' +
                'Run `plan2meal login` to authenticate via GitHub.',
            requiresAuth: true,
        };
    }
    // Try to refresh token if needed
    const validToken = await ensureValidToken(sessionId);
    if (!validToken) {
        sessionStore.delete(sessionId);
        return {
            text: '🔐 Your session has expired.\n\n' +
                'Run `plan2meal login` to authenticate again.',
            requiresAuth: true,
        };
    }
    // Route command
    return routeCommand(text, validToken);
}
/**
 * Ensure we have a valid token, refresh if needed
 */
async function ensureValidToken(sessionId) {
    const session = sessionStore.get(sessionId);
    if (!session?.tokens)
        return null;
    // Try the current token
    if (authClient && (await authClient.validateToken(session.tokens.token))) {
        return session.tokens.token;
    }
    // Try to refresh
    if (authClient) {
        const newTokens = await authClient.refreshTokens(session.tokens.refreshToken);
        if (newTokens) {
            session.tokens = newTokens;
            sessionStore.set(sessionId, session);
            return newTokens.token;
        }
    }
    return null;
}
/**
 * Start device flow login
 */
async function startLogin(sessionId) {
    if (!authClient) {
        return { text: '⚠️ Authentication is not configured.' };
    }
    try {
        const { deviceCode, userCode, verificationUri, expiresIn, interval } = await authClient.startDeviceFlow();
        pendingAuth.set(sessionId, {
            deviceCode,
            userCode,
            verificationUri,
            interval,
            expiresAt: Date.now() + expiresIn * 1000,
        });
        return {
            text: `🔐 **Plan2Meal Login**\n\n` +
                `1. Visit: ${verificationUri}\n` +
                `2. Enter code: \`${userCode}\`\n\n` +
                `Once you've signed in with GitHub, run any plan2meal command to complete login.\n\n` +
                `_Code expires in ${Math.floor(expiresIn / 60)} minutes._`,
            pendingAuth: true,
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { text: `❌ Failed to start login: ${message}` };
    }
}
/**
 * Check if pending auth is complete
 */
async function checkPendingAuth(sessionId) {
    const pending = pendingAuth.get(sessionId);
    if (!pending || !authClient) {
        return { text: '❌ No pending authentication found.' };
    }
    if (Date.now() > pending.expiresAt) {
        pendingAuth.delete(sessionId);
        return {
            text: '❌ Authentication expired. Run `plan2meal login` to try again.',
        };
    }
    try {
        const result = await authClient.pollForToken(pending.deviceCode);
        if (result.status === 'pending') {
            return {
                text: `⏳ Waiting for authorization...\n\n` +
                    `Visit: ${pending.verificationUri}\n` +
                    `Enter code: \`${pending.userCode}\``,
            };
        }
        if (result.status === 'success') {
            sessionStore.set(sessionId, {
                tokens: result.tokens,
                user: result.user,
                createdAt: Date.now(),
            });
            pendingAuth.delete(sessionId);
            return {
                text: `✅ Successfully logged in!\n\n` +
                    `Welcome, **${result.user.name}**!\n` +
                    `Type \`plan2meal help\` to get started.`,
            };
        }
        if (result.status === 'error') {
            pendingAuth.delete(sessionId);
            return { text: `❌ Authentication failed: ${result.message || result.error}` };
        }
        return { text: '❌ Unexpected response from server.' };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        pendingAuth.delete(sessionId);
        return { text: `❌ Authentication failed: ${message}` };
    }
}
/**
 * Route command to appropriate handler
 */
async function routeCommand(text, token) {
    const cmd = getCommands(token);
    // plan2meal add <url>
    const addMatch = text.match(/^plan2meal\s+add\s+(.+)$/i);
    if (addMatch) {
        const url = addMatch[1].trim();
        if (!(0, utils_1.isValidUrl)(url)) {
            return { text: '❌ Invalid URL. Please provide a valid recipe URL.' };
        }
        return cmd.addRecipe(token, url);
    }
    // plan2meal list
    if (/^plan2meal\s+list$/i.test(text)) {
        return cmd.listRecipes(token);
    }
    // plan2meal search <term>
    const searchMatch = text.match(/^plan2meal\s+search\s+(.+)$/i);
    if (searchMatch) {
        return cmd.searchRecipes(token, searchMatch[1].trim());
    }
    // plan2meal show <id>
    const showMatch = text.match(/^plan2meal\s+show\s+(.+)$/i);
    if (showMatch) {
        return cmd.showRecipe(token, showMatch[1].trim());
    }
    // plan2meal delete <id>
    const deleteMatch = text.match(/^plan2meal\s+delete\s+(.+)$/i);
    if (deleteMatch) {
        return cmd.deleteRecipe(token, deleteMatch[1].trim());
    }
    // plan2meal lists
    if (/^plan2meal\s+lists$/i.test(text)) {
        return cmd.lists(token);
    }
    // plan2meal list-show <id>
    const listShowMatch = text.match(/^plan2meal\s+list-show\s+(.+)$/i);
    if (listShowMatch) {
        return cmd.showList(token, listShowMatch[1].trim());
    }
    // plan2meal list-create <name>
    const listCreateMatch = text.match(/^plan2meal\s+list-create\s+(.+)$/i);
    if (listCreateMatch) {
        return cmd.createList(token, listCreateMatch[1].trim());
    }
    // plan2meal list-add <listId> <recipeId>
    const listAddMatch = text.match(/^plan2meal\s+list-add\s+(\S+)\s+(\S+)$/i);
    if (listAddMatch) {
        return cmd.addRecipeToList(token, listAddMatch[1].trim(), listAddMatch[2].trim());
    }
    return {
        text: '❌ Unknown command. Type `plan2meal help` for available commands.',
    };
}
/**
 * Get help text
 */
function getHelp() {
    return (`📖 **Plan2Meal Commands**\n\n` +
        `**Authentication**\n` +
        `• \`plan2meal login\` - Login via GitHub\n` +
        `• \`plan2meal logout\` - Logout\n` +
        `• \`plan2meal status\` - Check auth status\n` +
        `• \`plan2meal whoami\` - Show current user\n\n` +
        `**Recipes**\n` +
        `• \`plan2meal add <url>\` - Add recipe from URL\n` +
        `• \`plan2meal list\` - List your recipes\n` +
        `• \`plan2meal search <term>\` - Search recipes\n` +
        `• \`plan2meal show <id>\` - View recipe details\n` +
        `• \`plan2meal delete <id>\` - Delete recipe\n\n` +
        `**Grocery Lists**\n` +
        `• \`plan2meal lists\` - List all grocery lists\n` +
        `• \`plan2meal list-show <id>\` - View list with items\n` +
        `• \`plan2meal list-create <name>\` - Create new list\n` +
        `• \`plan2meal list-add <listId> <recipeId>\` - Add recipe to list`);
}
/**
 * Get auth status
 */
function getStatus(sessionId) {
    const session = sessionStore.get(sessionId);
    const pending = pendingAuth.get(sessionId);
    if (pending) {
        const remaining = Math.max(0, Math.floor((pending.expiresAt - Date.now()) / 1000 / 60));
        return {
            text: `⏳ **Pending Authorization**\n\n` +
                `Visit: ${pending.verificationUri}\n` +
                `Enter code: \`${pending.userCode}\`\n\n` +
                `_Expires in ${remaining} minutes._`,
        };
    }
    if (session?.tokens) {
        const age = Math.floor((Date.now() - session.createdAt) / 1000 / 60);
        return {
            text: `✅ **Authenticated**\n\n` +
                `User: ${session.user.name}\n` +
                `Session age: ${age} minutes`,
        };
    }
    return {
        text: `❌ **Not authenticated**\n\nRun \`plan2meal login\` to authenticate via GitHub.`,
    };
}
/**
 * Whoami - show current user
 */
function whoami(sessionId) {
    const session = sessionStore.get(sessionId);
    if (!session?.user) {
        return {
            text: `❌ Not logged in.\n\nRun \`plan2meal login\` to authenticate.`,
        };
    }
    return {
        text: `👤 **${session.user.name}**\n` +
            `📧 ${session.user.email}\n` +
            `🆔 ${session.user.id}`,
    };
}
/**
 * Logout - clears session
 */
function logout(sessionId) {
    sessionStore.delete(sessionId);
    pendingAuth.delete(sessionId);
    return { text: '🔒 You have been logged out of Plan2Meal.' };
}
/**
 * Set user session manually (for testing)
 */
function setUserToken(sessionId, token) {
    sessionStore.set(sessionId, {
        tokens: { token, refreshToken: '' },
        user: { id: '', name: 'Test User', email: '' },
        createdAt: Date.now(),
    });
}
/**
 * Clear session
 */
function clearSession(sessionId) {
    sessionStore.delete(sessionId);
    pendingAuth.delete(sessionId);
}
/**
 * Get session info
 */
function getSession(sessionId) {
    const session = sessionStore.get(sessionId);
    if (session?.tokens) {
        return { sessionToken: session.tokens.token };
    }
    return undefined;
}
//# sourceMappingURL=index.js.map