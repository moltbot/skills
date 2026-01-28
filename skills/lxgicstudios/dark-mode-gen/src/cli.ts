#!/usr/bin/env node

import { Command } from "commander";
import ora from "ora";
import * as fs from "fs";
import * as path from "path";
import { addDarkMode, processDirectory } from "./index";

const program = new Command();

program
  .name("ai-dark-mode")
  .description("Add dark mode support to components using AI")
  .version("1.0.0")
  .argument("<path>", "File or directory to add dark mode to")
  .option("--dry-run", "Print result without writing", false)
  .action(async (targetPath: string, options: { dryRun: boolean }) => {
    const absPath = path.resolve(targetPath);
    const stat = fs.statSync(absPath);

    if (stat.isDirectory()) {
      const spinner = ora("Adding dark mode to directory...").start();
      try {
        const results = await processDirectory(targetPath);
        spinner.succeed("Dark mode added!");
        results.forEach(r => console.log(`  ${r.file}: ${r.status}`));
      } catch (err: any) {
        spinner.fail(`Error: ${err.message}`);
        process.exit(1);
      }
    } else {
      const spinner = ora("Adding dark mode...").start();
      try {
        const result = await addDarkMode(targetPath);
        spinner.succeed("Dark mode added!");
        if (options.dryRun) {
          console.log("\n" + result);
        } else {
          fs.writeFileSync(absPath, result, "utf-8");
          console.log(`  Updated ${targetPath}`);
        }
      } catch (err: any) {
        spinner.fail(`Error: ${err.message}`);
        process.exit(1);
      }
    }
  });

program.parse();
