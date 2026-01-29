import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";

const openai = new OpenAI();

export async function scanFile(filePath: string): Promise<string> {
  const content = fs.readFileSync(filePath, "utf-8");
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a WCAG 2.1 accessibility expert. Scan the provided HTML/JSX code for accessibility issues. For each issue:
- State the problem (missing alt text, no label, poor contrast hint, etc.)
- Reference the WCAG criterion
- Provide the fix (actual code)
Be thorough but concise. If the code has no issues, say so.`
      },
      { role: "user", content: `File: ${path.basename(filePath)}\n\n${content}` }
    ],
    temperature: 0.3,
  });
  return response.choices[0].message.content || "";
}

export async function scanDirectory(dir: string): Promise<Map<string, string>> {
  const files = await glob("**/*.{html,htm,jsx,tsx}", {
    cwd: dir, absolute: true, ignore: ["**/node_modules/**", "**/dist/**"]
  });
  const results = new Map<string, string>();
  for (const f of files) {
    results.set(f, await scanFile(f));
  }
  return results;
}
