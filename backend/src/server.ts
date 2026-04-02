import dotenv from "dotenv";
import Fastify from "fastify";
import { MockProvider } from "./providers/mockProvider";
import { ProviderRegistry } from "./providers/providerRegistry";

dotenv.config();

const app = Fastify({
  logger: true,
});
const providerRegistry = new ProviderRegistry();

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
