import compression from 'compression';
import cookieParser from 'cookie-parser';
import express, { Router } from 'express';
import helmet from 'helmet';
import passport from 'passport';

import httpMiddlewares from '@infra/ioc/middlewares/http';
import cors from '@infra/server/cors';
import swagger from '@infra/server/swagger';

import { RegisterRoutes } from '../../../generated/routes';

interface IApplicationDependencies {
  bullMqDashboardRouter?: Router;
  healthRouter?: Router;
  mcpRouter?: Router;
}

export default function createApplication(
  dependencies: IApplicationDependencies = {}
) {
  const app = express();
  app.set('trust proxy', false);

  if (dependencies.healthRouter) {
    app.use(dependencies.healthRouter);
  }

  app.use(httpMiddlewares.appContextInit);
  app.use(httpMiddlewares.requestLogger);

  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(cors());

  app.use(httpMiddlewares.globalRateLimiter);

  app.use(express.static('public'));

  if (dependencies.bullMqDashboardRouter) {
    app.use('/bullmq-board-admin', dependencies.bullMqDashboardRouter);
  }

  app.use(compression());

  app.use(cookieParser());
  app.use(passport.initialize());

  app.use(httpMiddlewares.appContextEnrichment);

  if (dependencies.mcpRouter) {
    app.use('/mcp', dependencies.mcpRouter);
  }

  RegisterRoutes(app);

  app.use(...swagger());

  app.use(httpMiddlewares.errorHandler);

  return app;
}
