import { ELogOutcome } from '@shared/types/observability.types';

import setupOAuth from '@infra/config/oauth.config';
import { METRICS_CONFIG } from '@infra/config/observability-metrics.config';
import vars from '@infra/config/vars.config';
import logger from '@infra/observability/logger';
import reporter from '@infra/observability/reporter';

import createApplication from '@interface/http/application';

import createBullMqServerAdapter from './bull-dashboard';
import { startBullMQMetricsServer } from './bullmq-metrics';
import { makeRuntimeHealth } from './health';

export { default as createApplication } from '@interface/http/application';

function setupServer(bootstrap?: () => Promise<void>) {
  setupOAuth();

  const bullMqServerAdapter = createBullMqServerAdapter();
  const runtimeHealth = makeRuntimeHealth();
  startBullMQMetricsServer(METRICS_CONFIG.bullMQMetricsPort, logger);
  const app = createApplication({
    bullMqDashboardRouter: bullMqServerAdapter.getRouter(),
    healthRouter: runtimeHealth.router,
  });

  app.listen(vars.PORT, async () => {
    try {
      await bootstrap?.();
      runtimeHealth.markStartupComplete();
      logger.info('runtime.server.started', {
        port: vars.PORT,
        outcome: ELogOutcome.Success,
      });
    } catch (error) {
      runtimeHealth.markStartupFailed();
      reporter.report('runtime.startup.failed', error, {
        source: 'application-bootstrap',
      });
      throw error;
    }
  });
}

export default setupServer;
