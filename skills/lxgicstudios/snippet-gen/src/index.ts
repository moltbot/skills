import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

const openai = new OpenAI();

export async function generate(input: string): Promise<string> {
  const files = fs.readdirSync(input, { recursive: true }) as string[];
  const codeFiles = files.filter((f: string) => /\.(ts|tsx|js|jsx)$/.test(f)).slice(0, 20);
  const contents = codeFiles.map((f: string) => {
    try { return `--- ${f} ---\n` + fs.readFileSync(path.join(input, f), "utf-8").slice(0, 2000); } catch { return ""; }
  }).join("\n\n");
  const userContent = `Analyze these files and generate VS Code snippets:\n\n${contents}`;
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: `You are a VS Code snippet generator. Analyze the provided code files and identify repeated patterns. Generate a VS Code snippets JSON file with useful snippets extracted from those patterns. Each snippet should have a sensible prefix, body, and description.` },
      { role: "user", content: userContent }
    ],
    temperature: 0.7,
  });
  return response.choices[0].message.content || "";
}
