#!/usr/bin/env node

import { Command } from "commander";
import ora from "ora";
import * as fs from "fs";
import * as path from "path";
import { generateWebhook } from "./index";

const program = new Command();

program
  .name("ai-webhook")
  .description("Generate webhook handlers with retry logic")
  .version("1.0.0")
  .argument("<event>", "Webhook event description (e.g. 'stripe payment succeeded')")
  .option("-f, --framework <name>", "Framework: express, fastify, nextjs", "express")
  .option("-o, --output <path>", "Output file path")
  .action(async (event: string, options: { framework: string; output?: string }) => {
    const spinner = ora("Generating webhook handler...").start();
    try {
      const result = await generateWebhook(event, options.framework);
      spinner.succeed("Webhook handler generated!");

      if (options.output) {
        fs.writeFileSync(path.resolve(options.output), result, "utf-8");
        console.log(`  Written to ${options.output}`);
      } else {
        console.log("\n" + result);
      }
    } catch (err: any) {
      spinner.fail(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();
