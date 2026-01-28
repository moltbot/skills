import OpenAI from "openai";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const openai = new OpenAI();

export function collectFiles(dir: string, max = 20): string[] {
  const files: string[] = [];
  const walk = (d: string) => {
    if (files.length >= max) return;
    for (const entry of readdirSync(d)) {
      if (entry.startsWith(".") || entry === "node_modules" || entry === "dist") continue;
      const full = join(d, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if ([".ts", ".js", ".tsx", ".jsx", ".py", ".go"].includes(extname(full))) files.push(full);
    }
  };
  walk(dir);
  return files;
}

export async function generateQuestions(files: string[], level: string, count: number): Promise<string> {
  const code = files.map(f => `// ${f}\n${readFileSync(f, "utf-8").slice(0, 600)}`).join("\n\n").slice(0, 10000);

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
