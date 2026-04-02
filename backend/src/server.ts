import dotenv from "dotenv";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { ModeratorOrchestrator } from "./orchestrator/moderatorOrchestrator";
import type { OrchestrateRequest } from "./orchestrator/types";
import { MockProvider } from "./providers/mockProvider";
import { OpenAIProvider } from "./providers/openaiProvider";
import { GeminiProvider } from "./providers/geminiProvider";
import { DeepSeekProvider } from "./providers/deepseekProvider";
import { ProviderRegistry } from "./providers/providerRegistry";

dotenv.config();

const app = Fastify({
  logger: true,
});
const providerRegistry = new ProviderRegistry();
const orchestrator = new ModeratorOrchestrator(providerRegistry);

void app.register(cors, {
  origin: true,
});

// Always register Mock Providers for testing
providerRegistry.register(
  new MockProvider({
    id: "mock-openai",
    name: "Mock OpenAI",
    model: "gpt-mock-1",
  }),
);

providerRegistry.register(
  new MockProvider({
    id: "mock-gemini",
    name: "Mock Gemini",
    model: "gemini-mock-1",
  }),
);

// Register real providers if API keys are available
if (process.env.OPENAI_API_KEY) {
  providerRegistry.register(
    new OpenAIProvider({
      id: "openai",
      name: "OpenAI",
      model: "gpt-4o",
      apiKey: process.env.OPENAI_API_KEY,
    }),
  );
}

if (process.env.GOOGLE_API_KEY) {
  providerRegistry.register(
    new GeminiProvider({
      id: "gemini",
      name: "Gemini",
      model: "gemini-2.5-pro",
      apiKey: process.env.GOOGLE_API_KEY,
    }),
  );
}

if (process.env.DEEPSEEK_API_KEY) {
  providerRegistry.register(
    new DeepSeekProvider({
      id: "deepseek",
      name: "DeepSeek",
      model: "deepseek-chat",
      apiKey: process.env.DEEPSEEK_API_KEY,
    }),
  );
}

app.get("/healthz", async () => {
  return { ok: true };
});

app.get("/providers", async () => {
  return {
    providers: providerRegistry.list(),
  };
});

app.post<{ Params: { id: string }; Body: { prompt?: string } }>(
  "/providers/:id/generate",
  async (request, reply) => {
    const provider = providerRegistry.get(request.params.id);
    if (!provider) {
      return reply.code(404).send({ error: "provider_not_found" });
    }

    const prompt = request.body?.prompt?.trim();
    if (!prompt) {
      return reply.code(400).send({ error: "prompt_required" });
    }

    const result = await provider.generate({ prompt });
    return {
      provider: provider.metadata(),
      result,
    };
  },
);

app.post<{ Body: OrchestrateRequest }>("/orchestrate", async (request, reply) => {
  const topic = request.body?.topic?.trim();
  const selectedProviderIds = request.body?.selectedProviderIds ?? [];
  const rounds = request.body?.rounds ?? 3;

  if (!topic) {
    return reply.code(400).send({ error: "topic_required" });
  }
  if (!Array.isArray(selectedProviderIds) || selectedProviderIds.length < 2) {
    return reply.code(400).send({ error: "at_least_two_providers_required" });
  }
  if (rounds < 1 || rounds > 10) {
    return reply.code(400).send({ error: "rounds_out_of_range" });
  }

  const result = await orchestrator.run({
    topic,
    selectedProviderIds,
    rounds,
  });

  return result;
});

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";

const start = async (): Promise<void> => {
  try {
    await app.listen({ port, host });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

void start();
