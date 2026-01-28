import OpenAI from "openai";

const openai = new OpenAI();

export async function generateErrorHandler(framework: string, lang: string = "typescript"): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You generate production-ready error handling middleware.
Include:
- Custom error classes (AppError, ValidationError, NotFoundError, AuthError)
- Global error handler middleware
- Async handler wrapper (catchAsync/asyncHandler)
- Error logging with stack traces in dev, clean messages in prod
- Proper HTTP status codes
- Request ID tracking
- Language: ${lang}
- Framework: ${framework}
Return ONLY the code, no explanations.`
      },
      { role: "user", content: `Generate complete error handling setup for ${framework}` }
    ],
    temperature: 0.3,
  });

  const result = response.choices[0].message.content?.trim() || "";
  return result.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "");
}
