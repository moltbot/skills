import { requestJson } from "./http.js";
import { readConfig } from "../storage/config.js";
import { readTokens, writeTokens, clearTokens } from "../storage/tokens.js";
import { refreshTokens } from "./auth.js";
import { FitbitActivityResponse, FitbitProfileResponse } from "../types/fitbit.js";
import { ConfigData, TokenData } from "../types/config.js";

const API_BASE = "https://api.fitbit.com/1";

export class FitbitClient {
  constructor(
    private config: ConfigData,
    private tokens: TokenData,
    private verbose = false,
  ) {}

  static async load(verbose = false): Promise<FitbitClient> {
    const config = await readConfig();
    if (!config) {
      throw new Error("Missing client configuration. Run `fitbit configure` first.");
    }
    const tokens = await readTokens();
    if (!tokens) {
      throw new Error("Not authenticated. Run `fitbit login`.");
    }
    return new FitbitClient(config, tokens, verbose);
  }

  getTokenInfo(): TokenData {
    return this.tokens;
  }

  async getProfile(): Promise<FitbitProfileResponse> {
    return this.requestWithAuth<FitbitProfileResponse>(`${API_BASE}/user/-/profile.json`);
  }

  async getActivity(date: string): Promise<FitbitActivityResponse> {
    return this.requestWithAuth<FitbitActivityResponse>(
      `${API_BASE}/user/-/activities/date/${date}.json`,
    );
  }

  async refreshIfNeeded(): Promise<void> {
    const timeRemaining = this.tokens.expiresAt - Date.now();
    if (timeRemaining > 5 * 60 * 1000) {
      return;
    }
    await this.performRefresh();
  }

  private async requestWithAuth<T>(url: string): Promise<T> {
    await this.refreshIfNeeded();
    try {
      const { data } = await requestJson<T>(url, {
        headers: {
          Authorization: `Bearer ${this.tokens.accessToken}`,
        },
        verbose: this.verbose,
      });
      return data;
    } catch (error) {
      const status = (error as any).status as number | undefined;
      if (status === 401) {
        await this.performRefresh();
        const { data } = await requestJson<T>(url, {
          headers: {
            Authorization: `Bearer ${this.tokens.accessToken}`,
          },
          verbose: this.verbose,
        });
        return data;
      }
      throw error;
    }
  }

  private async performRefresh(): Promise<void> {
    try {
      const newTokens = await refreshTokens(
        this.tokens.refreshToken,
        this.config.clientId,
        this.verbose,
      );
      this.tokens = newTokens;
      await writeTokens(newTokens);
    } catch (error) {
      const status = (error as any).status as number | undefined;
      const data = (error as any).data as { errors?: Array<{ errorType: string }> } | undefined;
      if (status === 400 || status === 401) {
        const errorType = data?.errors?.[0]?.errorType;
        if (errorType === "invalid_grant") {
          await clearTokens();
          throw new Error("Session expired. Run `fitbit login` to re-authenticate.");
        }
      }
      throw error;
    }
  }
}
