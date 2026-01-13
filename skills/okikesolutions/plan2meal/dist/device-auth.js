"use strict";
/**
 * Plan2Meal Device Flow Authentication
 * Uses the Plan2Meal backend's device flow endpoints for secure CLI authentication.
 * No GitHub Client ID required - all OAuth is handled by the backend.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceAuth = void 0;
class DeviceAuth {
    constructor(apiUrl) {
        this.apiUrl = apiUrl.replace(/\/$/, '');
    }
    /**
     * Start the device authorization flow
     */
    async startDeviceFlow() {
        const response = await fetch(`${this.apiUrl}/auth/device/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientType: 'cli',
                clientVersion: '1.0.0',
            }),
        });
        if (!response.ok) {
            const error = await response.text().catch(() => response.statusText);
            throw new Error(`Failed to start device flow: ${error}`);
        }
        return (await response.json());
    }
    /**
     * Poll for authorization completion
     */
    async pollForToken(deviceCode) {
        const response = await fetch(`${this.apiUrl}/auth/device/poll`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ deviceCode }),
        });
        return (await response.json());
    }
    /**
     * Complete device flow with polling
     */
    async authenticate(onStatus) {
        onStatus?.('Starting device flow...');
        const { deviceCode, userCode, verificationUri, expiresIn, interval } = await this.startDeviceFlow();
        onStatus?.(`Visit ${verificationUri} and enter code: ${userCode}`);
        const expiresAt = Date.now() + expiresIn * 1000;
        let pollInterval = interval;
        while (Date.now() < expiresAt) {
            await this.sleep(pollInterval * 1000);
            onStatus?.('Waiting for authorization...');
            const result = await this.pollForToken(deviceCode);
            if (result.status === 'success') {
                return {
                    tokens: result.tokens,
                    user: result.user,
                };
            }
            if (result.status === 'error') {
                if (result.error === 'slow_down') {
                    pollInterval += 5;
                    continue;
                }
                throw new Error(result.message || result.error);
            }
        }
        throw new Error('Authorization timed out. Please try again.');
    }
    /**
     * Refresh access token using refresh token
     */
    async refreshTokens(refreshToken) {
        const response = await fetch(`${this.apiUrl}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
        });
        if (!response.ok) {
            return null;
        }
        const data = (await response.json());
        return data.tokens ?? null;
    }
    /**
     * Validate an existing token
     */
    async validateToken(token) {
        try {
            const response = await fetch(`${this.apiUrl}/auth/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.DeviceAuth = DeviceAuth;
//# sourceMappingURL=device-auth.js.map