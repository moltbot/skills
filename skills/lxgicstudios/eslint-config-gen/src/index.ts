import OpenAI from "openai";
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const openai = new OpenAI();

export function sampleFiles(dir: string, max = 10): string[] {
  const files: string[] = [];
  const walk = (d: string) => {
    if (files.length >= max) return;
    for (const entry of readdirSync(d)) {
      if (entry.startsWith(".") || entry === "node_modules" || entry === "dist") continue;
      const full = join(d, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if ([".ts", ".js", ".tsx", ".jsx"].includes(extname(full))) files.push(full);
    }
  };
  walk(dir);
  return files;
}

export async function generateConfig(files: string[], format: string): Promise<string> {
  const samples = files.map(f => readFileSync(f, "utf-8").slice(0, 800)).join("\n---\n").slice(0, 8000);

  let pkgContent = "{}";
  try { pkgContent = readFileSync(join(process.cwd(), "package.json"), "utf-8"); } catch {}

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: `You analyze code samples and generate an ESLint config that matches the project's existing patterns.
Detect: semicolons, quotes, indentation, trailing commas, naming conventions, import style.
Output format: ${format} (json or flat for eslint.config.js).
Include appropriate plugins (typescript-eslint if TS, react if JSX).
Return ONLY the config file content.` },
      { role: "user", content: `package.json:\n${pkgContent}\n\nCode samples:\n${samples}` }
    ],
    temperature: 0.3,
  });

  return response.choices[0].message.content?.trim() || "";
}
