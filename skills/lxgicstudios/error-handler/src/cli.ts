#!/usr/bin/env node

import { Command } from "commander";
import ora from "ora";
import * as fs from "fs";
import * as path from "path";
import { generateErrorHandler } from "./index";

const program = new Command();

program
  .name("ai-error-handler")
  .description("Generate error handling middleware for your framework")
  .version("1.0.0")
  .argument("<framework>", "Framework: express, fastify, koa, nextjs, hono")
  .option("-l, --lang <language>", "Language: typescript, javascript", "typescript")
  .option("-o, --output <path>", "Output file path")
  .action(async (framework: string, options: { lang: string; output?: string }) => {
    const spinner = ora("Generating error handler...").start();
    try {
      const result = await generateErrorHandler(framework, options.lang);
      spinner.succeed("Error handler generated!");

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
