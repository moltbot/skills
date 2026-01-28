import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

const openai = new OpenAI();

export async function generateReadme(dir: string): Promise<string> {
  let context = "";
  const pkgPath = path.join(dir, "package.json");
  if (fs.existsSync(pkgPath)) {
    context += "package.json:\n" + fs.readFileSync(pkgPath, "utf-8") + "\n\n";
  }
  const srcDir = path.join(dir, "src");
  if (fs.existsSync(srcDir)) {
    const files = fs.readdirSync(srcDir).filter(f => /\.(ts|js|tsx|jsx)$/.test(f)).slice(0, 5);
    for (const f of files) {
      const content = fs.readFileSync(path.join(srcDir, f), "utf-8").slice(0, 2000);
      context += `src/${f}:\n${content}\n\n`;
    }
  }
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: `You generate professional README.md files. Include: shields.io badges (npm version, license, downloads), project description, features list, installation, usage examples with code blocks, API reference if applicable, contributing section, and license. Use clean markdown formatting.` },
      { role: "user", content: `Generate a README.md for this project:\n\n${context || "No project files found. Generate a template README."}` }
    ],
    temperature: 0.5,
  });
  return response.choices[0].message.content || "";
}
