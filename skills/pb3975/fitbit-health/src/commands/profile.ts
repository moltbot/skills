import { Command } from "commander";
import { FitbitClient } from "../client/api.js";
import { createStyler, writeOutput, keyValueTable, OutputOptions } from "../utils/output.js";

export function registerProfile(command: Command): void {
  command
    .command("profile")
    .description("Show user profile information")
    .option("--json", "Output as JSON")
    .option("--no-color", "Disable colored output")
    .option("--verbose", "Show debug output")
    .action(async (options: OutputOptions & { verbose?: boolean }) => {
      const client = await FitbitClient.load(options.verbose);
      const profile = await client.getProfile();
      const user = profile.user;

      if (options.json) {
        await writeOutput(user, options);
        return;
      }

      const c = createStyler(options);
      console.log(c.bold("\nFitbit Profile\n"));
      console.log(keyValueTable([
        { key: "Display Name", value: user.displayName },
        { key: "Full Name", value: user.fullName },
        { key: "User ID", value: user.encodedId },
        { key: "Age", value: String(user.age) },
        { key: "Gender", value: user.gender },
        { key: "Height", value: `${user.height} ${user.heightUnit}` },
        { key: "Weight", value: `${user.weight} ${user.weightUnit}` },
        { key: "Timezone", value: user.timezone },
      ]));
    });
}
