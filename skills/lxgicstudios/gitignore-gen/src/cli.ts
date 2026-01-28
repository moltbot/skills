#!/usr/bin/env node

import { Command } from "commander";
import ora from "ora";
import * as fs from "fs";
import * as path from "path";
import { scanProject, generateGitignore } from "./index";

const program = new Command();

program
  .name("ai-gitignore")
  .description("Scans your project and generates the perfect .gitignore")
  .version("1.0.0")
  .option("-p, --preview", "Preview the generated .gitignore without writing it")
  .option("-o, --output <path>", "Output path for .gitignore", ".gitignore")
  .option("-d, --dir <path>", "Project directory to scan", ".")
  .action(async (opts) => {
    const spinner = ora("Scanning project files...").start();

    try {
      const dir = path.resolve(opts.dir);
      const files = await scanProject(dir);

      if (files.length === 0) {
        spinner.warn("No project files found. Are you in the right directory?");
        process.exit(1);
      }

      spinner.text = `Found ${files.length} project markers. Generating .gitignore...`;

      const gitignore = await generateGitignore(files);

      if (opts.preview) {
        spinner.stop();
        console.log("\n--- Generated .gitignore ---\n");
        console.log(gitignore);
        console.log("\n----------------------------\n");
      } else {
        const outPath = path.resolve(opts.output);
        fs.writeFileSync(outPath, gitignore + "\n");
        spinner.succeed(`Written to ${outPath}`);
      }
    } catch (err: any) {
      spinner.fail(err.message);
      process.exit(1);
    }
  });

program.parse();
