import IVarsConfig from '@shared/contracts/vars-config.contract';
import { IObservabilityTracingConfig } from '@shared/types/observability.types';

type TTracingVars = Pick<IVarsConfig, 'SENTRY_TRACES_SAMPLE_RATE'>;

const mockVarsConfig: TTracingVars = {
  SENTRY_TRACES_SAMPLE_RATE: '0',
};

jest.mock('@infra/config/vars.config', () => ({
  __esModule: true,
  default: mockVarsConfig,
}));

function loadSentryConfig(
  overrides: Partial<TTracingVars> = {}
): IObservabilityTracingConfig {
  Object.assign(mockVarsConfig, {
    SENTRY_TRACES_SAMPLE_RATE: '0',
    ...overrides,
  });

  let sentryConfig!: IObservabilityTracingConfig;
  jest.isolateModules(() => {
    sentryConfig = jest.requireActual<
      typeof import('@infra/integrations/sentry/sentry.config')
    >('@infra/integrations/sentry/sentry.config').SENTRY_CONFIG;
  });

  return sentryConfig;
}

describe('Sentry config', () => {
  it('keeps tracing disabled and shutdown bounded by default', () => {
    const sentryConfig = loadSentryConfig();

    expect(sentryConfig).toEqual({
      flushTimeoutMs: 5_000,
      tracePropagationTargets: [],
      tracesSampleRate: 0,
    });
    expect(Object.isFrozen(sentryConfig)).toBe(true);
    expect(Object.isFrozen(sentryConfig.tracePropagationTargets)).toBe(true);
  });

  it('uses the configured sampling rate with fixed propagation and flush bounds', () => {
    const config = loadSentryConfig({
      SENTRY_TRACES_SAMPLE_RATE: '0.25',
    });

    expect(config).toEqual({
      flushTimeoutMs: 5_000,
      tracePropagationTargets: [],
      tracesSampleRate: 0.25,
    });
  });

  it('disables tracing for an invalid sampling rate', () => {
    expect(
      loadSentryConfig({
        SENTRY_TRACES_SAMPLE_RATE: '1.1',
      })
    ).toEqual({
      flushTimeoutMs: 5_000,
      tracePropagationTargets: [],
      tracesSampleRate: 0,
    });
  });
});
