import { Command } from "commander";
import { readConfig } from "../storage/config.js";
import { readTokens, writeTokens, clearTokens } from "../storage/tokens.js";
import { startOAuthFlow, revokeToken } from "../client/auth.js";
import { createStyler, writeOutput, keyValueTable, OutputOptions } from "../utils/output.js";

export function registerAuth(command: Command): void {
  command
    .command("login")
    .description("Authenticate with Fitbit")
    .option("--verbose", "Show debug output")
    .action(async (options) => {
      const config = await readConfig();
      if (!config) {
        throw new Error("Run `fitbit configure` first to set your Client ID.");
      }
      const existing = await readTokens();
      if (existing && existing.expiresAt > Date.now()) {
        console.log("Already authenticated. Use `fitbit logout` to sign out first.");
        return;
      }
      console.log("Opening browser for Fitbit authorization...");
      const { tokens } = await startOAuthFlow(config, options.verbose);
      await writeTokens(tokens);
      console.log(`Authenticated as user ${tokens.userId}. Tokens saved.`);
    });

  command
    .command("logout")
    .description("Sign out and revoke tokens")
    .option("--verbose", "Show debug output")
    .action(async (options) => {
      const config = await readConfig();
      const tokens = await readTokens();
      if (!tokens) {
        console.log("Not currently authenticated.");
        return;
      }
      if (config) {
        await revokeToken(tokens.accessToken, config.clientId, options.verbose);
      }
      await clearTokens();
      console.log("Signed out and tokens cleared.");
    });

  command
    .command("status")
    .description("Show authentication status")
    .option("--json", "Output as JSON")
    .option("--no-color", "Disable colored output")
    .action(async (options: OutputOptions) => {
      const config = await readConfig();
      const tokens = await readTokens();
      const c = createStyler(options);

      if (options.json) {
        await writeOutput({
          configured: !!config,
          authenticated: !!tokens,
          userId: tokens?.userId ?? null,
          expiresAt: tokens?.expiresAt ?? null,
          scopes: tokens?.scopes ?? [],
        }, options);
        return;
      }

      if (!config) {
        console.log(c.yellow("Not configured. Run `fitbit configure` first."));
        return;
      }

      if (!tokens) {
        console.log(c.yellow("Not authenticated. Run `fitbit login`."));
        return;
      }

      const expiresIn = Math.max(0, Math.floor((tokens.expiresAt - Date.now()) / 1000 / 60));
      const expiryStatus = expiresIn > 5 ? c.green(`${expiresIn} min`) : c.red(`${expiresIn} min (expiring soon)`);

      console.log(keyValueTable([
        { key: "Status", value: c.green("Authenticated") },
        { key: "User ID", value: tokens.userId },
        { key: "Token expires in", value: expiryStatus },
        { key: "Scopes", value: tokens.scopes.join(", ") },
      ]));
    });
}
