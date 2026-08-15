import launchDarklyClient from '@infra/config/launchdarkly.config';
import reporter from '@infra/observability/reporter';

const INITIALIZATION_TIMEOUT_SECONDS = 5;

const SHUTDOWN_EXIT_CODES = Object.freeze({
  SIGINT: 130,
  SIGTERM: 143,
});

type TFeatureFlagShutdownSignal = keyof typeof SHUTDOWN_EXIT_CODES;

const SHUTDOWN_SIGNALS: readonly TFeatureFlagShutdownSignal[] = [
  'SIGINT',
  'SIGTERM',
];

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

async function shutdown(signal: TFeatureFlagShutdownSignal) {
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

  process.exit(SHUTDOWN_EXIT_CODES[signal]);
}

function registerShutdown() {
  SHUTDOWN_SIGNALS.forEach((signal) => {
    process.once(signal, async () => shutdown(signal));
  });
}

const featureFlagLifeCycle = Object.freeze({
  initialize,
  registerShutdown,
});

export default featureFlagLifeCycle;
