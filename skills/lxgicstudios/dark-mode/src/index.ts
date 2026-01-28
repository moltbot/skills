import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

const openai = new OpenAI();

export async function addDarkMode(filePath: string): Promise<string> {
  const absPath = path.resolve(filePath);
  const content = fs.readFileSync(absPath, "utf-8");

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a frontend expert. Add dark mode support to the given component.
Rules:
- Use CSS variables, Tailwind dark: prefix, or prefers-color-scheme depending on the existing approach
- Ensure all colors, backgrounds, borders, and shadows have dark variants
- Maintain contrast ratios for accessibility (WCAG AA minimum)
- Keep original light mode styling intact
- Return ONLY the modified file content, no explanations`
      },
      { role: "user", content: `File: ${path.basename(absPath)}\n\n${content}` }
    ],
    temperature: 0.3,
  });

  const result = response.choices[0].message.content?.trim() || content;
  return result.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "");
}

export async function processDirectory(dirPath: string): Promise<{ file: string; status: string }[]> {
  const absDir = path.resolve(dirPath);
  const results: { file: string; status: string }[] = [];
  const extensions = [".tsx", ".jsx", ".vue", ".svelte", ".css", ".scss"];

  const files = fs.readdirSync(absDir).filter(f => extensions.some(ext => f.endsWith(ext)));

  for (const file of files) {
    try {
      const filePath = path.join(absDir, file);
      const result = await addDarkMode(filePath);
      fs.writeFileSync(filePath, result, "utf-8");
      results.push({ file, status: "updated" });
    } catch (err: any) {
      results.push({ file, status: `error: ${err.message}` });
    }
  }

  return results;
}
