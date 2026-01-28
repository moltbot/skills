#!/usr/bin/env node

import { Command } from "commander";
import ora from "ora";
import { generateReleaseNotes } from "./index";

const program = new Command();

program
  .name("ai-release-notes")
  .description("Generate user-facing release notes from git log or changelog")
  .version("1.0.0")
  .option("--from <tag>", "Starting git tag or commit")
  .option("--to <tag>", "Ending git tag or commit (defaults to HEAD)")
  .option("--tone <tone>", "Tone of the release notes (fun, professional, casual)", "professional")
  .option("--changelog <path>", "Path to a changelog file")
  .option("--cwd <dir>", "Working directory for git operations")
  .action(async (options) => {
    const spinner = ora("Reading your changes...").start();

    try {
      spinner.text = "Generating release notes...";
      const notes = await generateReleaseNotes({
        from: options.from,
        to: options.to,
        tone: options.tone,
        changelog: options.changelog,
        cwd: options.cwd,
      });

      spinner.succeed("Done!");
      console.log("\n" + notes);
    } catch (err: any) {
      spinner.fail(err.message);
      process.exit(1);
    }
  });

program.parse();
