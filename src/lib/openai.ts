import OpenAI from "openai";

let client: OpenAI | null = null;

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} environment variable is not set`);
  }

  return value;
}

export function getOpenAI(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: getRequiredEnv("OPENAI_API_KEY"),
      maxRetries: 2,
      timeout: 30 * 1000,
    });
  }

  return client;
}

export const AI_MODEL =
  process.env.OPENAI_MODEL ?? "gpt-5-nano-2025-08-07";
