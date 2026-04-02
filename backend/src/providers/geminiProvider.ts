import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GenerateParams, GenerateResult, ModelProvider, ProviderMetadata } from "./types";

export type GeminiProviderConfig = {
  id: string;
  name: string;
  model: string;
  apiKey: string;
};

export class GeminiProvider implements ModelProvider {
  private client: GoogleGenerativeAI;

  constructor(private readonly config: GeminiProviderConfig) {
    this.client = new GoogleGenerativeAI(config.apiKey);
  }

  metadata(): ProviderMetadata {
    return {
      id: this.config.id,
      name: this.config.name,
      model: this.config.model,
    };
  }

  async generate(params: GenerateParams): Promise<GenerateResult> {
    const model = this.client.getGenerativeModel({ model: this.config.model });
    
    const result = await model.generateContent(params.prompt);
    const response = await result.response;
    
    return {
      text: response.text(),
      usage: {
        ...(response.usageMetadata?.promptTokenCount !== undefined && { inputTokens: response.usageMetadata.promptTokenCount }),
        ...(response.usageMetadata?.candidatesTokenCount !== undefined && { outputTokens: response.usageMetadata.candidatesTokenCount }),
      },
    };
  }
}
