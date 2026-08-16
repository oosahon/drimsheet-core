import IVarsConfig from '@shared/contracts/vars-config.contract';
import { IObservabilityTracingConfig } from '@shared/types/observability.types';

type TTracingVars = Pick<
  IVarsConfig,
  | 'SENTRY_FLUSH_TIMEOUT_MS'
  | 'SENTRY_TRACE_PROPAGATION_TARGETS'
  | 'SENTRY_TRACES_SAMPLE_RATE'
>;

const mockVarsConfig: TTracingVars = {
  SENTRY_FLUSH_TIMEOUT_MS: undefined,
  SENTRY_TRACE_PROPAGATION_TARGETS: '',
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
    SENTRY_FLUSH_TIMEOUT_MS: undefined,
    SENTRY_TRACE_PROPAGATION_TARGETS: '',
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
  });

  it('normalizes sampling, propagation origins, and the flush timeout', () => {
    const config = loadTracingConfig({
      SENTRY_FLUSH_TIMEOUT_MS: '2500',
      SENTRY_TRACE_PROPAGATION_TARGETS:
        'https://api.drimsheet.com/v1, http://localhost:3000/path, https://api.drimsheet.com, invalid',
      SENTRY_TRACES_SAMPLE_RATE: '0.25',
    });

    expect(config).toEqual({
      flushTimeoutMs: 2_500,
      tracePropagationTargets: [
        'https://api.drimsheet.com',
        'http://localhost:3000',
      ],
      tracesSampleRate: 0.25,
    });
  });

  it('uses safe bounds for invalid sampling and timeout values', () => {
    expect(
      loadTracingConfig({
        SENTRY_FLUSH_TIMEOUT_MS: '-1',
        SENTRY_TRACES_SAMPLE_RATE: '1.1',
      })
    ).toEqual({
      flushTimeoutMs: 5_000,
      tracePropagationTargets: [],
      tracesSampleRate: 0,
    });

    expect(
      loadTracingConfig({ SENTRY_FLUSH_TIMEOUT_MS: '60000' }).flushTimeoutMs
    ).toBe(30_000);
  });
});
