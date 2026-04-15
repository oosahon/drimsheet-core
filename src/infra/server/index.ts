import compression from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { RegisterRoutes } from '../../../routes';
import middlewares from '../../interface/http/middlewares';
import setupOAuth from '../config/oauth.config';
import { PORT } from '../config/vars.config';
import logger from '../observability/logger';
import bullMqServerAdapter from './bull-dashboard';
import cors from './cors';
import rateLimiter from './rate-limiter';
import swagger from './swagger';

function setupServer(bootstrap?: () => Promise<void>) {
  setupOAuth();

  const app = express();

  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(cors());

  app.use(rateLimiter());

  app.use(express.static('public'));

  app.use('/bullmq-board-admin', bullMqServerAdapter.getRouter());

  app.use(compression());

  app.use(cookieParser());

  app.use(middlewares.requestContext);

  app.use(middlewares.requestLogger);

  RegisterRoutes(app);

  app.use(...swagger());

  app.use(middlewares.errorHandler);

  app.listen(PORT, async () => {
    await bootstrap?.();
    logger.info(`Server listening on port ${PORT}`);
  });
}

export default setupServer;
