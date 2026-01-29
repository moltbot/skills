"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeAndGenerateTests = analyzeAndGenerateTests;
exports.writeTestFile = writeTestFile;
const openai_1 = __importDefault(require("openai"));
const fs_1 = require("fs");
const path_1 = require("path");
const openai = new openai_1.default();
async function analyzeAndGenerateTests(filePath) {
    const code = (0, fs_1.readFileSync)(filePath, "utf-8");
    const ext = filePath.endsWith(".ts") || filePath.endsWith(".tsx") ? "ts" : "js";
    const name = (0, path_1.basename)(filePath, `.${ext}`);
    const testPath = (0, path_1.join)((0, path_1.dirname)(filePath), `${name}.test.${ext}`);
    let existingTests = "";
    if ((0, fs_1.existsSync)(testPath)) {
        existingTests = (0, fs_1.readFileSync)(testPath, "utf-8");
    }
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: `You analyze code and generate tests for untested paths. Return JSON:
{ "uncoveredPaths": ["description of untested path 1", ...], "testCode": "full test file content" }
Write Jest-compatible tests. Import from the relative source file. Cover edge cases, error paths, and boundary conditions.
If existing tests are provided, only add NEW tests for uncovered paths.
Return ONLY valid JSON.` },
            { role: "user", content: `Source file (${filePath}):\n${code}\n\nExisting tests:\n${existingTests || "None"}` }
        ],
        temperature: 0.3,
    });
    const result = JSON.parse(response.choices[0].message.content || "{}");
    return { testCode: result.testCode, testPath, uncoveredPaths: result.uncoveredPaths || [] };
}
function writeTestFile(testPath, testCode) {
    (0, fs_1.writeFileSync)(testPath, testCode);
}
