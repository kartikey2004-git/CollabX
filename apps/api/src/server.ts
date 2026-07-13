import "./env";
import { app } from "./app";
import { config } from "./config";
import logger from "./config/logger";

const start = async () => {
  try {
    const port = config.port;
    app.listen(port, () => {
      logger.info(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    logger.error({ error }, 'Error starting server');
    process.exit(1);
  }
};

process.on('SIGINT', () => {
  logger.info('Stopping server (SIGINT)...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Stopping server (SIGTERM)...');
  process.exit(0);
});

start();
