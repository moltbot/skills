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
    .name("ai-interview")
    .description("Generate interview questions from your codebase")
    .version("1.0.0")
    .argument("<dir>", "Source directory to analyze")
    .option("-l, --level <level>", "Difficulty: junior, mid, senior", "mid")
    .option("-n, --count <number>", "Number of questions", "10")
    .option("-o, --output <path>", "Save to file")
    .action(async (dir, options) => {
    const spinner = (0, ora_1.default)("Analyzing codebase...").start();
    try {
        const files = (0, index_1.collectFiles)(dir);
        if (files.length === 0)
            throw new Error("No source files found");
        spinner.text = `Generating ${options.count} ${options.level}-level questions...`;
        const questions = await (0, index_1.generateQuestions)(files, options.level, parseInt(options.count));
        spinner.succeed(`Generated ${options.count} interview questions\n`);
        console.log(questions);
        if (options.output) {
            (0, fs_1.writeFileSync)(options.output, questions);
            console.log(`\nSaved to ${options.output}`);
        }
    }
    catch (err) {
        spinner.fail(`Error: ${err.message}`);
        process.exit(1);
    }
});
program.parse();
