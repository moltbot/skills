import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { TokenData } from "../types/config.js";

const CONFIG_DIR = path.join(os.homedir(), ".config", "fitbit-cli");
const TOKENS_PATH = path.join(CONFIG_DIR, "tokens.json");

export function getTokensPath(): string {
  return TOKENS_PATH;
}

export async function ensureTokensDir(): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
}

export async function readTokens(): Promise<TokenData | null> {
  try {
    const raw = await fs.readFile(TOKENS_PATH, "utf8");
    return JSON.parse(raw) as TokenData;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function writeTokens(tokens: TokenData): Promise<void> {
  await ensureTokensDir();
  const tempPath = `${TOKENS_PATH}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(tokens, null, 2), "utf8");
  await fs.rename(tempPath, TOKENS_PATH);
  await fs.chmod(TOKENS_PATH, 0o600);
}

export async function clearTokens(): Promise<void> {
  try {
    await fs.unlink(TOKENS_PATH);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return;
    }
    throw error;
  }
}
