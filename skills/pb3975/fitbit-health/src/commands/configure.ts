import { Command } from "commander";
import { readConfig, writeConfig } from "../storage/config.js";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

export function registerConfigure(command: Command): void {
  command
    .command("configure")
    .description("Set Fitbit client configuration")
    .option("--client-id <id>", "Fitbit client ID")
    .option("--port <port>", "Callback port", "18787")
    .action(async (options) => {
      const existing = await readConfig();
      const clientId = options.clientId ?? (await promptForClientId(existing?.clientId));
      const port = Number(options.port || existing?.callbackPort || 18787);
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error("Callback port must be an integer between 1 and 65535.");
      }
      if (!clientId) {
        throw new Error("Client ID is required. Get it from dev.fitbit.com.");
      }
      await writeConfig({ clientId, callbackPort: port });
      console.log("Fitbit client configuration saved.");
    });
}

async function promptForClientId(existing?: string): Promise<string> {
  const rl = createInterface({ input, output });
  try {
    const prompt = existing
      ? `Enter Fitbit Client ID (current: ${existing}): `
      : "Enter Fitbit Client ID (from dev.fitbit.com): ";
    const value = await rl.question(prompt);
    return value.trim() || existing || "";
  } finally {
    rl.close();
  }
}
