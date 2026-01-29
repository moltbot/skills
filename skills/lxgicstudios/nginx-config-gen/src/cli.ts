#!/usr/bin/env node

import { Command } from "commander";
import ora from "ora";
import * as fs from "fs";
import { generateNginxConfig } from "./index";

const program = new Command();

program
  .name("ai-nginx")
  .description("Generate nginx configs from plain English")
  .version("1.0.0")
  .argument("<description>", "Describe what you need in plain English")
  .option("-o, --output <file>", "Write config to a file instead of stdout")
  .action(async (description: string, options: { output?: string }) => {
    const spinner = ora("Generating nginx config...").start();

    try {
      const config = await generateNginxConfig({ description });

      spinner.succeed("Done!");
      console.log("\n" + config);

      if (options.output) {
        fs.writeFileSync(options.output, config, "utf-8");
        console.log(`\nWritten to ${options.output}`);
      }
    } catch (err: any) {
      spinner.fail(err.message);
      process.exit(1);
    }
  });

program.parse();
