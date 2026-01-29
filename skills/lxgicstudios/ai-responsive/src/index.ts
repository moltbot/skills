import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

const openai = new OpenAI();

export async function makeResponsive(filePath: string): Promise<string> {
  const absPath = path.resolve(filePath);
  const content = fs.readFileSync(absPath, "utf-8");
  const ext = path.extname(absPath);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert frontend developer. Take the given component and make it fully responsive.
Rules:
- Add proper breakpoints (mobile-first: 375px, 768px, 1024px, 1440px)
- Use CSS media queries or Tailwind responsive prefixes depending on the existing style approach
- Ensure text scales properly, layouts stack on mobile, images are fluid
- Keep the original functionality intact
- Return ONLY the modified file content, no explanations`
      },
      { role: "user", content: `File: ${path.basename(absPath)} (${ext})\n\n${content}` }
    ],
    temperature: 0.3,
  });

  const result = response.choices[0].message.content?.trim() || content;
  // Strip markdown code fences if present
  return result.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "");
}
