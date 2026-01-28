import OpenAI from "openai";
import * as fs from "fs";
import { glob } from "glob";

const openai = new OpenAI();

export async function scanDirectory(dir: string): Promise<string[]> {
  const files = await glob("**/*.{js,ts,jsx,tsx,html,vue,svelte,php}", {
    cwd: dir, absolute: true, ignore: ["**/node_modules/**", "**/dist/**", "**/.git/**"]
  });
  const contents: string[] = [];
  for (const f of files) {
    try {
      const content = fs.readFileSync(f, "utf-8");
      if (content.length > 0 && content.length < 50000) {
        contents.push(`// File: ${f}\n${content}`);
      }
    } catch {}
  }
  return contents;
}

export async function analyzeForXSS(codeChunks: string[]): Promise<string> {
  const combined = codeChunks.join("\n\n").substring(0, 60000);
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a security expert specializing in XSS (Cross-Site Scripting) detection. Analyze the code for XSS vulnerabilities including reflected, stored, and DOM-based XSS. For each finding show the file, vulnerability type, severity, and a concrete fix. Be concise." },
      { role: "user", content: combined }
    ],
    temperature: 0.2,
  });
  return response.choices[0].message.content || "No XSS issues found.";
}
