#!/usr/bin/env node

import { Command } from "commander";
import ora from "ora";
import * as fs from "fs";
import * as path from "path";
import { makeResponsive } from "./index";

const program = new Command();

program
  .name("ai-responsive")
  .description("Make components responsive with proper breakpoints using AI")
  .version("1.0.0")
  .argument("<file>", "Component file to make responsive")
  .option("-o, --output <path>", "Output file path (defaults to overwrite)")
  .option("--dry-run", "Print result without writing", false)
  .action(async (file: string, options: { output?: string; dryRun: boolean }) => {
    const spinner = ora("Making component responsive...").start();
    try {
      const result = await makeResponsive(file);
      spinner.succeed("Component is now responsive!");

      if (options.dryRun) {
        console.log("\n" + result);
      } else {
        const outPath = options.output || file;
        fs.writeFileSync(path.resolve(outPath), result, "utf-8");
        console.log(`  Written to ${outPath}`);
      }
    } catch (err: any) {
      spinner.fail(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();
