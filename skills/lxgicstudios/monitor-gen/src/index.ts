import OpenAI from "openai";

const openai = new OpenAI();

export async function generate(description: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: `You are a monitoring and observability expert. Generate complete monitoring setup from the description. Include: health check endpoints, Prometheus metrics, Grafana dashboard JSON, alerting rules (CPU, memory, error rates, latency), structured logging setup, error tracking (Sentry) integration, uptime checks, and a runbook template. Production-ready.` },
      { role: "user", content: description }
    ],
    temperature: 0.3,
  });
  return response.choices[0].message.content || "";
}
