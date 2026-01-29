import OpenAI from "openai";

const openai = new OpenAI();

export async function generateResume(description: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: `You create professional developer resumes in markdown format. Include: professional summary, technical skills (categorized), work experience with impact metrics, education, and projects. Use action verbs, quantify achievements, and follow modern resume best practices. Format cleanly in markdown.` },
      { role: "user", content: `Create a developer resume for: ${description}` }
    ],
    temperature: 0.6,
  });
  return response.choices[0].message.content || "";
}
