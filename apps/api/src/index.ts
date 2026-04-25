import Fastify from "fastify";
import { z } from "zod";

const app = Fastify({ logger: true });

app.get("/health", async () => {
  return { ok: true };
});

app.get("/version", async () => {
  const schema = z.object({ name: z.string(), version: z.string() });
  return schema.parse({ name: "@ntm/api", version: "0.1.0" });
});

const port = Number(process.env.PORT ?? 4000);

app
  .listen({ port, host: "0.0.0.0" })
  .then(() => {
    app.log.info(`API listening on ${port}`);
  })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
