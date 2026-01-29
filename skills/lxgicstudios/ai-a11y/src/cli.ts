#!/usr/bin/env node

import { Command } from "commander";
import ora from "ora";
import * as fs from "fs";
import { scanFile, scanDirectory } from "./index";

const program = new Command();

program
  .name("ai-a11y")
  .description("Scan HTML/JSX for accessibility issues")
  .version("1.0.0")
  .argument("<path>", "File or directory to scan")
  .action(async (inputPath: string) => {
    const spinner = ora("Scanning for accessibility issues...").start();
    try {
      const stat = fs.statSync(inputPath);
      if (stat.isDirectory()) {
        const results = await scanDirectory(inputPath);
        spinner.succeed(`Scanned ${results.size} file(s)\n`);
        results.forEach((result, file) => {
          console.log(`\n--- ${file} ---`);
          console.log(result);
        });
      } else {
        const result = await scanFile(inputPath);
        spinner.succeed("Scan complete!\n");
        console.log(result);
      }
    } catch (err: any) {
      spinner.fail(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();
