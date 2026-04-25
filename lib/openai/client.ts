import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" });
  }
  return _client;
}

export const openai = {
  chat: {
    completions: {
      create: (...args: Parameters<OpenAI["chat"]["completions"]["create"]>) =>
        getOpenAIClient().chat.completions.create(...args),
    },
  },
} as OpenAI;
