import dotenv from "dotenv";
import Fastify from "fastify";
import { ModeratorOrchestrator } from "./orchestrator/moderatorOrchestrator";
import type { OrchestrateRequest } from "./orchestrator/types";
import { MockProvider } from "./providers/mockProvider";
import { ProviderRegistry } from "./providers/providerRegistry";

dotenv.config();

const app = Fastify({
  logger: true,
});
const providerRegistry = new ProviderRegistry();
const orchestrator = new ModeratorOrchestrator(providerRegistry);

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
