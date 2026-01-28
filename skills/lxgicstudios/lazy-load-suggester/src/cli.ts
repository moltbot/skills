#!/usr/bin/env node

import { Command } from "commander";
import ora from "ora";
import { scanComponents, analyzeLazyLoad } from "./index";

const program = new Command();

program
  .name("ai-lazy-load")
  .description("Identify components to lazy load using AI")
  .version("1.0.0")
  .argument("[directory]", "Directory to scan", ".")
  .action(async (directory: string) => {
    const spinner = ora("Scanning components...").start();
    try {
      const codeChunks = await scanComponents(directory);
      if (codeChunks.length === 0) {
        spinner.warn("No component files found.");
        return;
      }
      spinner.text = `Analyzing ${codeChunks.length} component(s) for lazy loading...`;
      const analysis = await analyzeLazyLoad(codeChunks);
      spinner.succeed("Lazy Loading Analysis:");
      console.log(`\n${analysis}`);
    } catch (err: any) {
      spinner.fail(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();
