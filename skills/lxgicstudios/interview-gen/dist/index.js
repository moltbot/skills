"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectFiles = collectFiles;
exports.generateQuestions = generateQuestions;
const openai_1 = __importDefault(require("openai"));
const fs_1 = require("fs");
const path_1 = require("path");
const openai = new openai_1.default();
function collectFiles(dir, max = 20) {
    const files = [];
    const walk = (d) => {
        if (files.length >= max)
            return;
        for (const entry of (0, fs_1.readdirSync)(d)) {
            if (entry.startsWith(".") || entry === "node_modules" || entry === "dist")
                continue;
            const full = (0, path_1.join)(d, entry);
            if ((0, fs_1.statSync)(full).isDirectory())
                walk(full);
            else if ([".ts", ".js", ".tsx", ".jsx", ".py", ".go"].includes((0, path_1.extname)(full)))
                files.push(full);
        }
    };
    walk(dir);
    return files;
}
async function generateQuestions(files, level, count) {
    const code = files.map(f => `// ${f}\n${(0, fs_1.readFileSync)(f, "utf-8").slice(0, 600)}`).join("\n\n").slice(0, 10000);
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: `You generate technical interview questions based on a codebase. Level: ${level}. Generate ${count} questions.
Categories: architecture decisions, code patterns, debugging scenarios, optimization, testing strategy.
For each question include: the question, what you're testing for, and a brief ideal answer outline.
Format as numbered markdown list.` },
            { role: "user", content: code }
        ],
        temperature: 0.5,
    });
    return response.choices[0].message.content?.trim() || "";
}
