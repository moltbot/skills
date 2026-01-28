import OpenAI from "openai";

const openai = new OpenAI();

export async function generatePitch(idea: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: `You create compelling startup pitch deck content. Generate slides for: Problem, Solution, Market Size (TAM/SAM/SOM), Business Model, Traction/Milestones, Competition (and your edge), Team requirements, Financial Projections, The Ask. Be specific, use numbers, and make it investor-ready. Format in markdown with clear slide separators.` },
      { role: "user", content: `Create pitch deck content for: ${idea}` }
    ],
    temperature: 0.7,
  });
  return response.choices[0].message.content || "";
}
