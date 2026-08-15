import setupOAuth from '@infra/config/oauth.config';
import vars from '@infra/config/vars.config';
import logger from '@infra/observability/logger';
import setupObservability from '@infra/observability/setup';

import createApplication from '@interface/http/application';

import createBullMqServerAdapter from './bull-dashboard';

export { default as createApplication } from '@interface/http/application';

function setupServer(bootstrap?: () => Promise<void>) {
  setupObservability();
  setupOAuth();

  const bullMqServerAdapter = createBullMqServerAdapter();
  const app = createApplication({
    bullMqDashboardRouter: bullMqServerAdapter.getRouter(),
  });

  app.listen(vars.PORT, async () => {
    await bootstrap?.();
    logger.info('runtime.server.started', {
      port: vars.PORT,
      outcome: 'success',
    });
  });
}

export default setupServer;
