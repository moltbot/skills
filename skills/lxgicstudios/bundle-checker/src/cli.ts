#!/usr/bin/env node

import { Command } from "commander";
import ora from "ora";
import { gatherBundleInfo, analyzeBundleSize } from "./index";

const program = new Command();

program
  .name("ai-bundle-check")
  .description("Analyze bundle size and get AI optimization suggestions")
  .version("1.0.0")
  .argument("[directory]", "Project root directory", ".")
  .action(async (directory: string) => {
    const spinner = ora("Gathering bundle info...").start();
    try {
      const info = gatherBundleInfo(directory);
      if (!info.packageJson) {
        spinner.warn("No package.json found in this directory.");
        return;
      }
      spinner.text = "AI analyzing bundle size...";
      const analysis = await analyzeBundleSize(info);
      spinner.succeed("Bundle Analysis Complete:");
      console.log(`\n${analysis}`);
    } catch (err: any) {
      spinner.fail(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();
