#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const ora_1 = __importDefault(require("ora"));
const index_1 = require("./index");
const fs_1 = require("fs");
const program = new commander_1.Command();
program
    .name("ai-eslint-config")
    .description("Generate ESLint config from your codebase patterns")
    .version("1.0.0")
    .option("-f, --format <type>", "Config format: json or flat", "flat")
    .option("-d, --dir <path>", "Source directory to analyze", ".")
    .action(async (options) => {
    const spinner = (0, ora_1.default)("Sampling codebase...").start();
    try {
        const files = (0, index_1.sampleFiles)(options.dir);
        if (files.length === 0)
            throw new Error("No source files found");
        spinner.text = `Analyzing ${files.length} files...`;
        const config = await (0, index_1.generateConfig)(files, options.format);
        const outFile = options.format === "json" ? ".eslintrc.json" : "eslint.config.js";
        (0, fs_1.writeFileSync)(outFile, config);
        spinner.succeed(`ESLint config written to ${outFile}`);
    }
    catch (err) {
        spinner.fail(`Error: ${err.message}`);
        process.exit(1);
    }
});
program.parse();
