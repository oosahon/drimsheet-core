import launchDarklyClient from '@infra/integrations/launchdarkly/launchdarkly.client';
import reporter from '@infra/observability/reporter';

const INITIALIZATION_TIMEOUT_SECONDS = 5;

async function initialize() {
  try {
    await launchDarklyClient.waitForInitialization({
      timeout: INITIALIZATION_TIMEOUT_SECONDS,
    });
  } catch (error) {
    reporter.report('integration.feature_flag.initialization_failed', error, {
      source: 'feature-flag-initialization',
    });
  }
}

async function shutdown(signal: 'SIGINT' | 'SIGTERM') {
  try {
    await launchDarklyClient.flush();
  } catch (error) {
    reporter.report('integration.feature_flag.flush_failed', error, {
      operation: 'flush',
      signal,
      source: 'feature-flag-shutdown',
    });
  }

  try {
    launchDarklyClient.close();
  } catch (error) {
    reporter.report('integration.feature_flag.close_failed', error, {
      operation: 'close',
      signal,
      source: 'feature-flag-shutdown',
    });
  }
}

const launchDarklyLifecycle = Object.freeze({ initialize, shutdown });

export default launchDarklyLifecycle;
