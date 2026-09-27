import { HttpServer } from '@infrastructure/http/server';
import { logger } from '@infrastructure/logging/logger';

const startApplication = async (): Promise<void> => {
  try {
    const server = new HttpServer();
    await server.start();
  } catch (err) {
    logger.fatal({ err }, 'Failed to start PulseFlow application');
    process.exit(1);
  }
};

startApplication();
