import OpenAI from "openai";

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_NOT_CONFIGURED");
  }
  return new OpenAI({ apiKey });
}
