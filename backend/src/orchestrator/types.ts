export type OrchestrateRequest = {
  topic: string;
  selectedProviderIds: string[];
  rounds?: number;
};

export type TranscriptEntry = {
  round: number;
  providerId: string;
  providerName: string;
  text: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
};

export type OrchestrateResult = {
  topic: string;
  rounds: number;
  selectedProviderIds: string[];
  transcript: TranscriptEntry[];
  conclusion: string;
  disagreements: string[];
  evidence: string[];
  nextActions: string[];
};
