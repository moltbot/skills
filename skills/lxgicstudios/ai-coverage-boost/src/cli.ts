#!/usr/bin/env node
import { Command } from "commander";
import ora from "ora";
import { analyzeAndGenerateTests, writeTestFile } from "./index";

const program = new Command();
program
  .name("ai-coverage-boost")
  .description("Find untested code paths and generate tests")
  .version("1.0.0")
  .argument("<file>", "Source file to analyze")
  .option("-d, --dry-run", "Show uncovered paths without writing tests", false)
  .option("-o, --output <path>", "Custom output path for test file")
  .action(async (file: string, options: { dryRun: boolean; output?: string }) => {
    const spinner = ora("Analyzing code coverage...").start();
    try {
      const result = await analyzeAndGenerateTests(file);
      spinner.succeed(`Found ${result.uncoveredPaths.length} untested paths`);
      console.log("\nUncovered paths:");
      result.uncoveredPaths.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
      if (!options.dryRun) {
        const outPath = options.output || result.testPath;
        writeTestFile(outPath, result.testCode);
        console.log(`\n✅ Tests written to ${outPath}`);
      }
    } catch (err: any) {
      spinner.fail(`Error: ${err.message}`);
      process.exit(1);
    }
  });
program.parse();
