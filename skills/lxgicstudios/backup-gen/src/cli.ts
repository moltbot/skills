#!/usr/bin/env node

import { Command } from "commander";
import ora from "ora";
import { generate } from "./index";

const program = new Command();

program
  .name("ai-backup-script")
  .description("Generate database backup scripts with AI")
  .version("1.0.0")
  .argument("<spec>", "Backup specification (database, schedule, destination)")
  .action(async (spec: string) => {
    const spinner = ora("Generating...").start();
    try {
      const result = await generate(spec);
      spinner.succeed("Done:\n");
      console.log(result);
    } catch (err: any) {
      spinner.fail(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();
