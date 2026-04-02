import type { ModelProvider, ProviderMetadata } from "./types";

export class ProviderRegistry {
  private readonly providers = new Map<string, ModelProvider>();

  register(provider: ModelProvider): void {
    const providerId = provider.metadata().id;
    this.providers.set(providerId, provider);
  }

  list(): ProviderMetadata[] {
    return Array.from(this.providers.values()).map((provider) => provider.metadata());
  }

  get(providerId: string): ModelProvider | undefined {
    return this.providers.get(providerId);
  }
}
