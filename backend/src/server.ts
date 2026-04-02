import dotenv from "dotenv";
import Fastify from "fastify";

dotenv.config();

const app = Fastify({
  logger: true,
});

app.get("/healthz", async () => {
  return { ok: true };
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
