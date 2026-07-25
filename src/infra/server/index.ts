import createApplication from '../../interface/http/application';
import setupOAuth from '../config/oauth.config';
import { PORT } from '../config/vars.config';
import logger from '../observability/logger';
import setupObservability from '../observability/setup';
import createBullMqServerAdapter from './bull-dashboard';

export { default as createApplication } from '../../interface/http/application';

function setupServer(bootstrap?: () => Promise<void>) {
  setupObservability();
  setupOAuth();

  const bullMqServerAdapter = createBullMqServerAdapter();
  const app = createApplication({
    bullMqDashboardRouter: bullMqServerAdapter.getRouter(),
  });

  app.listen(PORT, async () => {
    await bootstrap?.();
    logger.info(`Server listening on port ${PORT}`);
  });
}

export default setupServer;
