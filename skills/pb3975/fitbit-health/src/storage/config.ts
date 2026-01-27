import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { ConfigData } from "../types/config.js";

const CONFIG_DIR = path.join(os.homedir(), ".config", "fitbit-cli");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

export function getConfigPath(): string {
  return CONFIG_PATH;
}

export async function ensureConfigDir(): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
}

export async function readConfig(): Promise<ConfigData | null> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw) as ConfigData;
    if (!parsed.clientId) {
      return null;
    }
    return {
      clientId: parsed.clientId,
      callbackPort: parsed.callbackPort ?? 18787,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function writeConfig(config: ConfigData): Promise<void> {
  await ensureConfigDir();
  const payload: ConfigData = {
    clientId: config.clientId.trim(),
    callbackPort: config.callbackPort ?? 18787,
  };
  const tempPath = `${CONFIG_PATH}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(payload, null, 2), "utf8");
  await fs.rename(tempPath, CONFIG_PATH);
}
