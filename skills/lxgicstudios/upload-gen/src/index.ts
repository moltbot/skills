import OpenAI from "openai";

const openai = new OpenAI();

export async function generate(description: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: `You are a file upload expert. Generate complete file upload handling from the description. Include: multer/busboy middleware, file validation (type, size), storage configuration (local/S3/GCS), presigned URLs if cloud storage, image processing (sharp) if images, TypeScript types, error handling, and cleanup logic. Production-ready code.` },
      { role: "user", content: description }
    ],
    temperature: 0.3,
  });
  return response.choices[0].message.content || "";
}
