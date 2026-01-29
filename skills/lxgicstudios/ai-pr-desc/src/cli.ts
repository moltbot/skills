#!/usr/bin/env node
import { Command } from "commander";
import { generatePRDescription } from "./index";

const program = new Command();

program
  .name("ai-pr-desc")
  .description("Generate a PR title and description from your branch diff")
  .version("1.0.0")
  .option("--base <branch>", "Base branch to diff against", "main")
  .action(async (opts) => {
    try {
      const description = await generatePRDescription({ base: opts.base });
      console.log("\n" + description);
    } catch (err: any) {
      console.error("Error:", err.message);
      process.exit(1);
    }
  });

program.parse();
