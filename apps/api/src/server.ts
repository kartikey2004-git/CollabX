import "./env";
import { app } from "./app";
import { config } from "./config";
import logger from "./config/logger";

// This is the actual entry point of the API — it boots up the Express app.
const start = async () => {
  try {
    const port = config.port; // port on which server runs

    // Start the server and listen for incoming requests.
    app.listen(port, () => {
      logger.info(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    // If startup fails for any reason, log it and exit instead of hanging.
    logger.error({ error }, "Error starting server");
    process.exit(1);
  }
};

// Handle Ctrl+C (SIGINT) so the server shuts down cleanly instead of just being killed.
process.on("SIGINT", () => {
  logger.info("Stopping server (SIGINT)...");
  process.exit(0);
});

// Handle SIGTERM (e.g. sent by Docker/hosting platforms when stopping the app).
process.on("SIGTERM", () => {
  logger.info("Stopping server (SIGTERM)...");
  process.exit(0);
});

// Actually run everything above.
start();
