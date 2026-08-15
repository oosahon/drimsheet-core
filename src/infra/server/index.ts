import { ELogOutcome } from '@shared/types/observability.types';

import setupOAuth from '@infra/config/oauth.config';
import { METRICS_CONFIG } from '@infra/config/observability-metrics.config';
import vars from '@infra/config/vars.config';
import logger from '@infra/observability/logger';

import createApplication from '@interface/http/application';

import createBullMqServerAdapter from './bull-dashboard';
import { startBullMQMetricsServer } from './bullmq-metrics';

export { default as createApplication } from '@interface/http/application';

function setupServer(bootstrap?: () => Promise<void>) {
  setupOAuth();

  const bullMqServerAdapter = createBullMqServerAdapter();
  startBullMQMetricsServer(METRICS_CONFIG.bullMQMetricsPort, logger);
  const app = createApplication({
    bullMqDashboardRouter: bullMqServerAdapter.getRouter(),
  });

  app.listen(vars.PORT, async () => {
    await bootstrap?.();
    logger.info('runtime.server.started', {
      port: vars.PORT,
      outcome: ELogOutcome.Success,
    });
  });
}

export default setupServer;
