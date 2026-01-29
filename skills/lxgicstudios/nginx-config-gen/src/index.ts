import OpenAI from "openai";

export interface NginxOptions {
  description: string;
  output?: string;
}

export async function generateNginxConfig(options: NginxOptions): Promise<string> {
  const openai = new OpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an nginx configuration expert. Generate production-ready nginx config files from plain English descriptions. Include helpful comments explaining each section. Only output the nginx config, no extra explanation. Use best practices: proper security headers, gzip, timeouts, etc.`,
      },
      {
        role: "user",
        content: `Generate an nginx config for: ${options.description}`,
      },
    ],
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content || "# No config generated";
}
