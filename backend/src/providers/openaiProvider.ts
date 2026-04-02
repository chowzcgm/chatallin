import OpenAI from "openai";
import type { GenerateParams, GenerateResult, ModelProvider, ProviderMetadata } from "./types";

export type OpenAIProviderConfig = {
  id: string;
  name: string;
  model: string;
  apiKey: string;
};

export class OpenAIProvider implements ModelProvider {
  private client: OpenAI;

  constructor(private readonly config: OpenAIProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
  }

  metadata(): ProviderMetadata {
    return {
      id: this.config.id,
      name: this.config.name,
      model: this.config.model,
    };
  }

  async generate(params: GenerateParams): Promise<GenerateResult> {
    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages: [{ role: "user", content: params.prompt }],
    });

    return {
      text: response.choices[0]?.message?.content ?? "",
      usage: {
        ...(response.usage?.prompt_tokens !== undefined && { inputTokens: response.usage.prompt_tokens }),
        ...(response.usage?.completion_tokens !== undefined && { outputTokens: response.usage.completion_tokens }),
      },
    };
  }
}
