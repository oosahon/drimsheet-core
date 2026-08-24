import { ELogOutcome } from '@shared/types/observability.types';

import vars from '@infra/config/vars.config';
import setupOAuth from '@infra/integrations/oauth/google-oauth.strategy';
import logger from '@infra/observability/logger';
import reporter from '@infra/observability/reporter';

import createApplication from '@interface/http/application';

import createBullMqServerAdapter from './bull-dashboard';
import { makeRuntimeHealth } from './health';

export { default as createApplication } from '@interface/http/application';

function setupServer(bootstrap?: () => Promise<void>) {
  setupOAuth();

  const bullMqServerAdapter = createBullMqServerAdapter();
  const runtimeHealth = makeRuntimeHealth();
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
