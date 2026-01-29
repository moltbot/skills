import OpenAI from "openai";
import * as fs from "fs";

const openai = new OpenAI();

export async function generateTests(input: string, framework: string = "playwright"): Promise<string> {
  const isUrl = input.startsWith("http://") || input.startsWith("https://");
  const isFile = !isUrl && fs.existsSync(input);
  let content: string;

  if (isUrl) {
    content = `URL: ${input}\nGenerate e2e tests for a web page at this URL. Cover common user flows: navigation, form submissions, button clicks, page loads.`;
  } else if (isFile) {
    content = `Component file:\n${fs.readFileSync(input, "utf-8")}\n\nGenerate e2e tests for this component.`;
  } else {
    content = `Description: ${input}\nGenerate e2e tests based on this description.`;
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You generate ${framework} e2e test files. Write complete, runnable test files with proper imports. Cover happy paths and edge cases. Use best practices: proper selectors, assertions, and test isolation. Return ONLY the code, no explanations.`
      },
      { role: "user", content }
    ],
    temperature: 0.4,
  });
  return response.choices[0].message.content || "";
}
