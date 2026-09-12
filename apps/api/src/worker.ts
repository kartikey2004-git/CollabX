import "./env";
import logger from "./config/logger";
import { indexingWorker } from "./workers/indexing.worker";

// Standalone entrypoint for the background indexing worker — a separate process from the API
// server (see server.ts/app.ts's own split), started with `npm run worker`. Importing
// indexing.worker.ts is enough to start it listening (the Worker begins consuming jobs as soon as
// it's constructed).

logger.info("Indexing worker started, listening for jobs on the 'indexing' queue");

process.on("SIGINT", async () => {
  logger.info("Stopping indexing worker (SIGINT)...");
  await indexingWorker.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("Stopping indexing worker (SIGTERM)...");
  await indexingWorker.close();
  process.exit(0);
});
