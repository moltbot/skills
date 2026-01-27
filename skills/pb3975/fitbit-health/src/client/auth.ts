import crypto from "node:crypto";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import open from "open";
import { requestJson } from "./http.js";
import { ConfigData, OAuthStateData, TokenData } from "../types/config.js";
import { FitbitTokenResponse, FitbitErrorResponse } from "../types/fitbit.js";

const TOKEN_URL = "https://api.fitbit.com/oauth2/token";
const REVOKE_URL = "https://api.fitbit.com/oauth2/revoke";
const REDIRECT_PATH = "/callback";
const DEFAULT_SCOPE = "activity heartrate sleep weight profile";
const AUTH_BASE = "https://www.fitbit.com/oauth2/authorize";

export interface OAuthResult {
  tokens: TokenData;
}

export async function startOAuthFlow(config: ConfigData, verbose = false): Promise<OAuthResult> {
  const codeVerifier = createCodeVerifier();
  const codeChallenge = createCodeChallenge(codeVerifier);
  const state = crypto.randomBytes(16).toString("hex");
  const tempFile = getTempAuthPath();

  await fs.writeFile(
    tempFile,
    JSON.stringify({ codeVerifier, state, createdAt: Date.now() } satisfies OAuthStateData),
    { encoding: "utf8", mode: 0o600, flag: "wx" },
  );

  const { port, server, waitForCallback } = await startCallbackServer(
    config.callbackPort ?? 18787,
  );

  const redirectUri = `http://127.0.0.1:${port}${REDIRECT_PATH}`;
  const authUrl = new URL(AUTH_BASE);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", DEFAULT_SCOPE);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("state", state);

  if (verbose) {
    console.error(`[fitbit] OAuth redirect: ${redirectUri}`);
  }

  await open(authUrl.toString());

  try {
    const { code, returnedState } = await waitForCallback();
    const storedState = await readTempAuth(tempFile);
    if (!storedState || storedState.state !== returnedState) {
      throw new Error("OAuth state mismatch. Please retry login.");
    }

    const tokens = await exchangeCode({
      code,
      codeVerifier: storedState.codeVerifier,
      clientId: config.clientId,
      redirectUri,
      verbose,
    });

    return { tokens };
  } finally {
    server.close();
    await safeUnlink(tempFile);
  }
}

export async function refreshTokens(
  refreshToken: string,
  clientId: string,
  verbose = false,
): Promise<TokenData> {
  const body = new URLSearchParams();
  body.set("grant_type", "refresh_token");
  body.set("refresh_token", refreshToken);
  body.set("client_id", clientId);

  const { data } = await requestJson<FitbitTokenResponse>(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    verbose,
  });

  return mapTokenResponse(data);
}

export async function revokeToken(token: string, clientId: string, verbose = false): Promise<void> {
  const body = new URLSearchParams();
  body.set("token", token);
  body.set("client_id", clientId);

  await requestJson<FitbitErrorResponse>(REVOKE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    verbose,
  }).catch(() => undefined);
}

async function exchangeCode(params: {
  code: string;
  codeVerifier: string;
  clientId: string;
  redirectUri: string;
  verbose: boolean;
}): Promise<TokenData> {
  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("code", params.code);
  body.set("code_verifier", params.codeVerifier);
  body.set("redirect_uri", params.redirectUri);
  body.set("client_id", params.clientId);

  const { data } = await requestJson<FitbitTokenResponse>(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    verbose: params.verbose,
  });

  return mapTokenResponse(data);
}

function mapTokenResponse(response: FitbitTokenResponse): TokenData {
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    expiresAt: Date.now() + response.expires_in * 1000,
    userId: response.user_id,
    scopes: response.scope.split(" "),
  };
}

function createCodeVerifier(): string {
  return base64Url(crypto.randomBytes(64));
}

function createCodeChallenge(verifier: string): string {
  return base64Url(crypto.createHash("sha256").update(verifier).digest());
}

function base64Url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function getTempAuthPath(): string {
  const randomId = crypto.randomBytes(16).toString("hex");
  return path.join(os.tmpdir(), `fitbit-auth-${process.pid}-${randomId}.json`);
}

async function readTempAuth(pathname: string): Promise<OAuthStateData | null> {
  try {
    const raw = await fs.readFile(pathname, "utf8");
    return JSON.parse(raw) as OAuthStateData;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function safeUnlink(pathname: string): Promise<void> {
  try {
    await fs.unlink(pathname);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return;
    }
  }
}

async function startCallbackServer(startPort: number): Promise<{
  port: number;
  server: http.Server;
  waitForCallback: () => Promise<{ code: string; returnedState: string }>;
}> {
  const ports = [startPort, startPort + 1, startPort + 2, startPort + 3];

  let server: http.Server | null = null;
  let port = startPort;
  for (const candidate of ports) {
    try {
      server = await new Promise<http.Server>((resolve, reject) => {
        const srv = http.createServer();
        srv.once("error", reject);
        srv.listen(candidate, "127.0.0.1", () => resolve(srv));
      });
      port = candidate;
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EADDRINUSE") {
        continue;
      }
      throw error;
    }
  }

  if (!server) {
    throw new Error("Unable to start local OAuth callback server.");
  }

  const waitForCallback = () =>
    new Promise<{ code: string; returnedState: string }>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("OAuth flow timed out. Please retry login."));
        server?.close();
      }, 5 * 60 * 1000);

      server?.on("request", (req, res) => {
        if (!req.url) {
          res.writeHead(400);
          res.end("Missing callback URL.");
          return;
        }
        const url = new URL(req.url, `http://127.0.0.1:${port}`);
        if (url.pathname !== REDIRECT_PATH) {
          res.writeHead(404);
          res.end("Not found.");
          return;
        }
        const code = url.searchParams.get("code");
        const returnedState = url.searchParams.get("state");
        if (!code || !returnedState) {
          res.writeHead(400);
          res.end("Missing OAuth code.");
          return;
        }
        clearTimeout(timeout);
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("Fitbit authorization complete. You can close this window.");
        resolve({ code, returnedState });
      });
    });

  return { port, server, waitForCallback };
}
