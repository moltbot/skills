/**
 * Plan2Meal ClawdHub Skill - Main Entry Point
 *
 * Handles incoming messages and routes them to appropriate command handlers.
 * Uses backend-based Device Flow for authentication - no configuration required.
 */
interface Config {
    apiUrl: string;
}
/**
 * Initialize the skill with configuration
 */
declare function initialize(customConfig?: Partial<Config>): {
    name: string;
    version: string;
    commands: Array<{
        pattern: RegExp;
        description: string;
    }>;
};
/**
 * Get command patterns for skill registration
 */
declare function getCommandPatterns(): Array<{
    pattern: RegExp;
    description: string;
}>;
/**
 * Handle incoming message
 */
declare function handleMessage(message: string, context?: {
    sessionId: string;
    userId?: string;
}): Promise<{
    text: string;
    requiresAuth?: boolean;
    pendingAuth?: boolean;
}>;
/**
 * Logout - clears session
 */
declare function logout(sessionId: string): {
    text: string;
};
/**
 * Set user session manually (for testing)
 */
declare function setUserToken(sessionId: string, token: string): void;
/**
 * Clear session
 */
declare function clearSession(sessionId: string): void;
/**
 * Get session info
 */
declare function getSession(sessionId: string): {
    sessionToken: string;
} | undefined;
export { initialize, handleMessage, setUserToken, clearSession, getSession, logout, getCommandPatterns, };
//# sourceMappingURL=index.d.ts.map