import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { RegisterRoutes } from '../../../routes';
import { PORT } from '../config/vars.config';
import logger from '../observability/logger';
import swagger from './swagger';
import rateLimiter from './rate-limiter';
import middlewares from '../../interface/http/middlewares';
import cors from './cors';

function setupServer(bootstrap?: () => Promise<void>) {
  const app = express();

  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(cors());

  app.use(rateLimiter());

  app.use(express.static('public'));

  app.use(compression());

  app.use(middlewares.requestContext);

  RegisterRoutes(app);

  app.use(...swagger());

  app.use(middlewares.errorHandler);

  app.listen(PORT, async () => {
    await bootstrap?.();
    logger.info(`Server listening on port ${PORT}`);
  });
}

export default setupServer;
