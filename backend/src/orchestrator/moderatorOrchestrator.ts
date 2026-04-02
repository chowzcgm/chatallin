import { ProviderRegistry } from "../providers/providerRegistry";
import type { OrchestrateRequest, OrchestrateResult, TranscriptEntry } from "./types";

export class ModeratorOrchestrator {
  constructor(private readonly providerRegistry: ProviderRegistry) {}

  async run(input: OrchestrateRequest): Promise<OrchestrateResult> {
    const rounds = Math.min(Math.max(input.rounds ?? 3, 1), 10);
    const selectedProviderIds = Array.from(new Set(input.selectedProviderIds));
    const transcript: TranscriptEntry[] = [];

    for (let round = 1; round <= rounds; round += 1) {
      for (const providerId of selectedProviderIds) {
        const provider = this.providerRegistry.get(providerId);
        if (!provider) {
          continue;
        }

        const prompt = this.buildPrompt({
          topic: input.topic,
          round,
          transcript,
        });
        const result = await provider.generate({ prompt });
        const metadata = provider.metadata();
        transcript.push({
          round,
          providerId: metadata.id,
          providerName: metadata.name,
          text: result.text,
        });
      }
    }

    return this.summarize({
      topic: input.topic,
      rounds,
      selectedProviderIds,
      transcript,
    });
  }

  private buildPrompt(params: { topic: string; round: number; transcript: TranscriptEntry[] }): string {
    const recent = params.transcript
      .slice(-3)
      .map((item) => `- (${item.providerId}) ${item.text}`)
      .join("\n");
    if (!recent) {
      return `Topic: ${params.topic}\nRound: ${params.round}\nProvide your initial analysis in 2-3 sentences.`;
    }
    return `Topic: ${params.topic}\nRound: ${params.round}\nRecent discussion:\n${recent}\nGive a concise response and move the discussion forward.`;
  }

  private summarize(params: {
    topic: string;
    rounds: number;
    selectedProviderIds: string[];
    transcript: TranscriptEntry[];
  }): OrchestrateResult {
    const lastByProvider = new Map<string, TranscriptEntry>();
    for (const entry of params.transcript) {
      lastByProvider.set(entry.providerId, entry);
    }
    const evidence = Array.from(lastByProvider.values()).map(
      (entry) => `${entry.providerId}: ${entry.text}`,
    );

    const conclusion =
      evidence.length > 0
        ? `After ${params.rounds} rounds, the selected models converged on a draft direction for "${params.topic}".`
        : `No model responses were produced for "${params.topic}".`;

    return {
      topic: params.topic,
      rounds: params.rounds,
      selectedProviderIds: params.selectedProviderIds,
      transcript: params.transcript,
      conclusion,
      disagreements: [
        "Models may still differ on implementation details and confidence levels.",
      ],
      evidence,
      nextActions: [
        "Review transcript highlights with a human moderator.",
        "Run one additional round with refined constraints if needed.",
      ],
    };
  }
}
