import OpenAI from "openai";

const openai = new OpenAI();

export async function generateTsconfig(projectType: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: `You generate optimal tsconfig.json files. Return ONLY valid JSON (the tsconfig content). Include comments as fields won't support them. Use the strictest practical settings for the project type. Include path aliases, proper module resolution, and build optimization settings.` },
      { role: "user", content: `Generate an optimal tsconfig.json for a ${projectType} project` }
    ],
    temperature: 0.3,
  });
  return response.choices[0].message.content || "{}";
}
