import OpenAI from "openai";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { basename, dirname, join } from "path";

const openai = new OpenAI();

export async function analyzeAndGenerateTests(filePath: string): Promise<{ testCode: string; testPath: string; uncoveredPaths: string[] }> {
  const code = readFileSync(filePath, "utf-8");
  const ext = filePath.endsWith(".ts") || filePath.endsWith(".tsx") ? "ts" : "js";
  const name = basename(filePath, `.${ext}`);
  const testPath = join(dirname(filePath), `${name}.test.${ext}`);

  let existingTests = "";
  if (existsSync(testPath)) {
    existingTests = readFileSync(testPath, "utf-8");
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

export function writeTestFile(testPath: string, testCode: string): void {
  writeFileSync(testPath, testCode);
}
