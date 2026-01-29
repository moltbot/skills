#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const ora_1 = __importDefault(require("ora"));
const index_1 = require("./index");
const program = new commander_1.Command();
program
    .name("ai-coverage-boost")
    .description("Find untested code paths and generate tests")
    .version("1.0.0")
    .argument("<file>", "Source file to analyze")
    .option("-d, --dry-run", "Show uncovered paths without writing tests", false)
    .option("-o, --output <path>", "Custom output path for test file")
    .action(async (file, options) => {
    const spinner = (0, ora_1.default)("Analyzing code coverage...").start();
    try {
        const result = await (0, index_1.analyzeAndGenerateTests)(file);
        spinner.succeed(`Found ${result.uncoveredPaths.length} untested paths`);
        console.log("\nUncovered paths:");
        result.uncoveredPaths.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
        if (!options.dryRun) {
            const outPath = options.output || result.testPath;
            (0, index_1.writeTestFile)(outPath, result.testCode);
            console.log(`\n✅ Tests written to ${outPath}`);
        }
    }
    catch (err) {
        spinner.fail(`Error: ${err.message}`);
        process.exit(1);
    }
});
program.parse();
