/**
 * GitHub OAuth Device Flow for Plan2Meal
 * Implements secure authentication via GitHub's Device Flow
 */
interface AuthResult {
    success: boolean;
    sessionToken?: string;
    error?: string;
    userCode?: string;
    verificationUri?: string;
}
declare class GitHubDeviceAuth {
    private clientId;
    private apiUrl;
    private scope;
    constructor(clientId: string, apiUrl: string, scope?: string);
    /**
     * Start the device flow - returns user code and verification URL
     */
    startDeviceFlow(): Promise<{
        deviceCode: string;
        userCode: string;
        verificationUri: string;
        expiresIn: number;
        interval: number;
    }>;
    /**
     * Poll for access token after user authorizes
     */
    pollForToken(deviceCode: string, interval: number, expiresIn: number, onPoll?: () => void): Promise<string>;
    /**
     * Exchange GitHub token for Plan2Meal session token
     */
    exchangeForSessionToken(githubToken: string): Promise<string>;
    /**
     * Full device flow: start, wait for user, exchange token
     */
    authenticate(onStatus?: (status: string) => void): Promise<AuthResult>;
    /**
     * Validate existing session token
     */
    validateToken(token: string): Promise<boolean>;
    private sleep;
}
export = GitHubDeviceAuth;
//# sourceMappingURL=github-oauth.d.ts.map