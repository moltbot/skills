/**
 * Plan2Meal Device Flow Authentication
 * Uses the Plan2Meal backend's device flow endpoints for secure CLI authentication.
 * No GitHub Client ID required - all OAuth is handled by the backend.
 */
interface DeviceFlowStart {
    deviceCode: string;
    userCode: string;
    verificationUri: string;
    verificationUriComplete: string;
    expiresIn: number;
    interval: number;
}
interface DevicePollSuccess {
    status: 'success';
    tokens: {
        token: string;
        refreshToken: string;
    };
    user: {
        id: string;
        name: string;
        email: string;
        avatarUrl?: string;
    };
}
interface DevicePollPending {
    status: 'pending';
    message: string;
}
interface DevicePollError {
    status: 'error';
    error: string;
    message: string;
}
type DevicePollResult = DevicePollSuccess | DevicePollPending | DevicePollError;
export interface AuthTokens {
    token: string;
    refreshToken: string;
}
export interface AuthUser {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
}
export interface AuthSession {
    tokens: AuthTokens;
    user: AuthUser;
}
export declare class DeviceAuth {
    private apiUrl;
    constructor(apiUrl: string);
    /**
     * Start the device authorization flow
     */
    startDeviceFlow(): Promise<DeviceFlowStart>;
    /**
     * Poll for authorization completion
     */
    pollForToken(deviceCode: string): Promise<DevicePollResult>;
    /**
     * Complete device flow with polling
     */
    authenticate(onStatus?: (status: string) => void): Promise<AuthSession>;
    /**
     * Refresh access token using refresh token
     */
    refreshTokens(refreshToken: string): Promise<AuthTokens | null>;
    /**
     * Validate an existing token
     */
    validateToken(token: string): Promise<boolean>;
    private sleep;
}
export {};
//# sourceMappingURL=device-auth.d.ts.map