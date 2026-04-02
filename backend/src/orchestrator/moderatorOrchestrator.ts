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
          usage: result.usage,
        });
      }
    }

    return await this.summarize({
      topic: input.topic,
      rounds,
      selectedProviderIds,
      transcript,
    });
  }

  private buildPrompt(params: { topic: string; round: number; transcript: TranscriptEntry[] }): string {
    const recent = params.transcript
      .slice(-3)
      .map((item) => `- (${item.providerName}) ${item.text}`)
      .join("\n");
    if (!recent) {
      return `Topic: ${params.topic}\nRound: ${params.round}\nProvide your initial analysis. Keep it concise.`;
    }
    return `Topic: ${params.topic}\nRound: ${params.round}\nRecent discussion:\n${recent}\nGive a concise response, addressing the recent points, and move the discussion forward.`;
  }

  private async summarize(params: {
    topic: string;
    rounds: number;
    selectedProviderIds: string[];
    transcript: TranscriptEntry[];
  }): Promise<OrchestrateResult> {
    const lastByProvider = new Map<string, TranscriptEntry>();
    for (const entry of params.transcript) {
      lastByProvider.set(entry.providerId, entry);
    }
    const evidence = Array.from(lastByProvider.values()).map(
      (entry) => `${entry.providerName}: ${entry.text}`,
    );

    // Try to use the first selected provider as a moderator to summarize
    const moderatorProviderId = params.selectedProviderIds[0];
    const moderator = moderatorProviderId ? this.providerRegistry.get(moderatorProviderId) : null;

    let conclusion = `After ${params.rounds} rounds, the selected models discussed "${params.topic}".`;
    let disagreements = ["Models may still differ on implementation details."];
    let nextActions = ["Review transcript highlights."];

    if (moderator && params.transcript.length > 0 && !moderator.metadata().id.startsWith("mock")) {
      const fullTranscript = params.transcript
        .map((t) => `Round ${t.round} - ${t.providerName}:\n${t.text}`)
        .join("\n\n");

      const prompt = `You are a moderator summarizing a multi-LLM discussion.
Topic: ${params.topic}

Full Transcript:
${fullTranscript}

Please provide a JSON output summarizing the discussion with the following structure:
{
  "conclusion": "A unified summary of the discussion",
  "disagreements": ["List of any points where models disagreed"],
  "nextActions": ["Suggested next steps based on the discussion"]
}
Output ONLY valid JSON without any markdown formatting or extra text.`;

      try {
        const result = await moderator.generate({ prompt });
        let jsonStr = result.text.trim();
        // Remove markdown code blocks if present
        if (jsonStr.startsWith("\`\`\`json")) {
          jsonStr = jsonStr.replace(/^\`\`\`json\n?/, "").replace(/\n?\`\`\`$/, "");
        } else if (jsonStr.startsWith("\`\`\`")) {
          jsonStr = jsonStr.replace(/^\`\`\`\n?/, "").replace(/\n?\`\`\`$/, "");
        }
        
        const parsed = JSON.parse(jsonStr);
        if (parsed.conclusion) conclusion = parsed.conclusion;
        if (Array.isArray(parsed.disagreements)) disagreements = parsed.disagreements;
        if (Array.isArray(parsed.nextActions)) nextActions = parsed.nextActions;
      } catch (error) {
        console.error("Failed to parse moderator summary:", error);
      }
    } else if (!moderator || moderator.metadata().id.startsWith("mock")) {
        conclusion = evidence.length > 0
        ? `[Mock Summary] After ${params.rounds} rounds, the models converged on a draft direction.`
        : `No model responses were produced for "${params.topic}".`;
    }

    return {
      topic: params.topic,
      rounds: params.rounds,
      selectedProviderIds: params.selectedProviderIds,
      transcript: params.transcript,
      conclusion,
      disagreements,
      evidence,
      nextActions,
    };
  }
}
