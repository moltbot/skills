"use strict";
/**
 * GitHub OAuth Device Flow for Plan2Meal
 * Implements secure authentication via GitHub's Device Flow
 */
class GitHubDeviceAuth {
    constructor(clientId, apiUrl, scope = 'read:user user:email') {
        this.clientId = clientId;
        this.apiUrl = apiUrl.replace(/\/$/, '');
        this.scope = scope;
    }
    /**
     * Start the device flow - returns user code and verification URL
     */
    async startDeviceFlow() {
        const response = await fetch('https://github.com/login/device/code', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: this.clientId,
                scope: this.scope,
            }),
        });
        if (!response.ok) {
            throw new Error(`Failed to start device flow: ${response.status}`);
        }
        const data = (await response.json());
        return {
            deviceCode: data.device_code,
            userCode: data.user_code,
            verificationUri: data.verification_uri,
            expiresIn: data.expires_in,
            interval: data.interval,
        };
    }
    /**
     * Poll for access token after user authorizes
     */
    async pollForToken(deviceCode, interval, expiresIn, onPoll) {
        const startTime = Date.now();
        const expiresAt = startTime + expiresIn * 1000;
        while (Date.now() < expiresAt) {
            await this.sleep(interval * 1000);
            onPoll?.();
            const response = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    client_id: this.clientId,
                    device_code: deviceCode,
                    grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
                }),
            });
            const data = (await response.json());
            if (data.access_token) {
                return data.access_token;
            }
            if (data.error === 'authorization_pending') {
                continue;
            }
            if (data.error === 'slow_down') {
                interval += 5;
                continue;
            }
            if (data.error === 'expired_token') {
                throw new Error('Authorization expired. Please try again.');
            }
            if (data.error === 'access_denied') {
                throw new Error('Authorization was denied.');
            }
            if (data.error) {
                throw new Error(data.error_description || data.error);
            }
        }
        throw new Error('Authorization timed out. Please try again.');
    }
    /**
     * Exchange GitHub token for Plan2Meal session token
     */
    async exchangeForSessionToken(githubToken) {
        const response = await fetch(`${this.apiUrl}/api/auth/github/exchange`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ github_token: githubToken }),
        });
        if (!response.ok) {
            const error = await response.text().catch(() => response.statusText);
            throw new Error(`Failed to exchange token: ${error}`);
        }
        const data = (await response.json());
        if (data.error) {
            throw new Error(data.error);
        }
        if (!data.session_token) {
            throw new Error('No session token received');
        }
        return data.session_token;
    }
    /**
     * Full device flow: start, wait for user, exchange token
     */
    async authenticate(onStatus) {
        try {
            onStatus?.('Starting GitHub device flow...');
            const { deviceCode, userCode, verificationUri, expiresIn, interval } = await this.startDeviceFlow();
            onStatus?.(`Visit ${verificationUri} and enter code: ${userCode}`);
            const githubToken = await this.pollForToken(deviceCode, interval, expiresIn, () => {
                onStatus?.('Waiting for authorization...');
            });
            onStatus?.('Exchanging token...');
            const sessionToken = await this.exchangeForSessionToken(githubToken);
            return { success: true, sessionToken };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, error: message };
        }
    }
    /**
     * Validate existing session token
     */
    async validateToken(token) {
        try {
            const response = await fetch(`${this.apiUrl}/api/auth/validate`, {
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
module.exports = GitHubDeviceAuth;
//# sourceMappingURL=github-oauth.js.map