import OpenAI from "openai";

const openai = new OpenAI();

export async function generateCors(description: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: `You generate CORS configurations. Provide configs for Express.js, Next.js API routes, and nginx. Include: allowed origins, methods, headers, credentials handling, preflight caching, and security best practices. Add comments explaining each setting. Format in markdown with code blocks for each framework.` },
      { role: "user", content: `Generate CORS config for: ${description}` }
    ],
    temperature: 0.4,
  });
  return response.choices[0].message.content || "";
}
