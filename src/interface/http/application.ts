import compression from 'compression';
import cookieParser from 'cookie-parser';
import express, { Router } from 'express';
import helmet from 'helmet';
import { RegisterRoutes } from '../../../generated/routes';
import cors from '../../infra/server/cors';
import rateLimiter from '../../infra/server/rate-limiter';
import swagger from '../../infra/server/swagger';
import middlewares from './middlewares';
import makeSignupRateLimitMiddlewares from './middlewares/signup-rate-limit.middleware';
import internalRouter from './routes/internal.routes';

interface IApplicationDependencies {
  bullMqDashboardRouter?: Router;
}

export default function createApplication(
  dependencies: IApplicationDependencies = {}
) {
  const app = express();
  app.set('trust proxy', false);

  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(cors());

  app.use(rateLimiter());
  app.use(
    '/api/v1/auth/signup-with-email',
    ...makeSignupRateLimitMiddlewares()
  );

  app.use(express.static('public'));

  if (dependencies.bullMqDashboardRouter) {
    app.use('/bullmq-board-admin', dependencies.bullMqDashboardRouter);
  }

  app.use(compression());

  app.use(cookieParser());

  app.use(middlewares.appContext);

  app.use(middlewares.requestLogger);

  app.use('/internal', internalRouter);

  RegisterRoutes(app);

  app.use(...swagger());

  app.use(middlewares.errorHandler);

  return app;
}
