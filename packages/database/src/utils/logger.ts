import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

// A shared logger (using the pino library) for database-related scripts (like seeding), so their output is consistent with the rest of the app's logs.

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: {
    env: process.env.NODE_ENV || 'development',
    service: 'collab-editor-db',
  },
  timestamp: pino.stdTimeFunctions.isoTime,

  // In development, print logs in a colorized, human-readable format. In production, leave this undefined so logs are plain JSON (easier for log tools to parse).

  transport: isDevelopment
    ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    }
    : undefined,
});

export default logger;
