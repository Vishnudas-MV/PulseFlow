import { Router } from 'express';
import { createHealthRouter } from './health.routes';

export const createApiRouter = (): Router => {
  const router = Router();

  // Mount health & system routes
  router.use(createHealthRouter());

  return router;
};
