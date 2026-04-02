export type ProviderMetadata = {
  id: string;
  name: string;
  model: string;
  contextWindow?: number;
};

export type GenerateParams = {
  prompt: string;
};

export type GenerateResult = {
  text: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
};

export interface ModelProvider {
  metadata(): ProviderMetadata;
  generate(params: GenerateParams): Promise<GenerateResult>;
}
