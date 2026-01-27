export interface ConfigData {
  clientId: string;
  callbackPort: number;
}

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
  scopes: string[];
}

export interface OAuthStateData {
  codeVerifier: string;
  state: string;
  createdAt: number;
}
