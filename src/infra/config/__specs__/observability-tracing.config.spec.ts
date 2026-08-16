import IVarsConfig from '@shared/contracts/vars-config.contract';
import { IObservabilityTracingConfig } from '@shared/types/observability.types';

type TTracingVars = Pick<IVarsConfig, 'SENTRY_TRACES_SAMPLE_RATE'>;

const mockVarsConfig: TTracingVars = {
  SENTRY_TRACES_SAMPLE_RATE: '0',
};

jest.mock('../vars.config', () => ({
  __esModule: true,
  default: mockVarsConfig,
}));

function loadTracingConfig(
  overrides: Partial<TTracingVars> = {}
): IObservabilityTracingConfig {
  Object.assign(mockVarsConfig, {
    SENTRY_TRACES_SAMPLE_RATE: '0',
    ...overrides,
  });

  let tracingConfig!: IObservabilityTracingConfig;
  jest.isolateModules(() => {
    tracingConfig = jest.requireActual<
      typeof import('@infra/config/observability-tracing.config')
    >('../observability-tracing.config').TRACING_CONFIG;
  });

  return tracingConfig;
}

describe('observability tracing config', () => {
  it('keeps tracing disabled and shutdown bounded by default', () => {
    const tracingConfig = loadTracingConfig();

    expect(tracingConfig).toEqual({
      flushTimeoutMs: 5_000,
      tracePropagationTargets: [],
      tracesSampleRate: 0,
    });
    expect(Object.isFrozen(tracingConfig)).toBe(true);
    expect(Object.isFrozen(tracingConfig.tracePropagationTargets)).toBe(true);
  });

  it('uses the configured sampling rate with fixed propagation and flush bounds', () => {
    const config = loadTracingConfig({
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
      loadTracingConfig({
        SENTRY_TRACES_SAMPLE_RATE: '1.1',
      })
    ).toEqual({
      flushTimeoutMs: 5_000,
      tracePropagationTargets: [],
      tracesSampleRate: 0,
    });
  });
});
