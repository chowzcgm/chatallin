import type { GenerateParams, GenerateResult, ModelProvider, ProviderMetadata } from "./types";

type MockProviderConfig = {
  id: string;
  name: string;
  model: string;
};

export class MockProvider implements ModelProvider {
  constructor(private readonly config: MockProviderConfig) {}

  metadata(): ProviderMetadata {
    return {
      id: this.config.id,
      name: this.config.name,
      model: this.config.model,
      contextWindow: 8192,
    };
  }

  async generate(params: GenerateParams): Promise<GenerateResult> {
    const snippet = params.prompt.slice(0, 80);
    return {
      text: `[${this.config.id}] mock response for: ${snippet}`,
      usage: {
        inputTokens: Math.max(1, Math.ceil(params.prompt.length / 4)),
        outputTokens: 24,
      },
    };
  }
}
