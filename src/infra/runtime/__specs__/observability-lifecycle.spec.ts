import mockLogger from '@shared/contracts/__mocks__/logger.mock';

type TShutdownSignal = 'SIGINT' | 'SIGTERM';
type TObservabilityLifecycle =
  (typeof import('@infra/runtime/observability-lifecycle'))['default'];

const mockFlushSentry = jest.fn<Promise<boolean>, [number]>();
const mockShutdownMetrics = jest.fn<Promise<void>, []>();

jest.mock('@sentry/node', () => ({
  flush: mockFlushSentry,
}));

jest.mock('../../config/observability-tracing.config', () => ({
  TRACING_CONFIG: {
    flushTimeoutMs: 4_000,
  },
}));

jest.mock('../../observability', () => ({
  metricsRuntime: {
    shutdown: mockShutdownMetrics,
  },
}));

jest.mock('../../observability/logger', () => ({
  __esModule: true,
  default: mockLogger,
}));

async function loadObservabilityLifecycle(): Promise<TObservabilityLifecycle> {
  let lifecycle: TObservabilityLifecycle | undefined;

  await jest.isolateModulesAsync(async () => {
    lifecycle = (await import('@infra/runtime/observability-lifecycle'))
      .default;
  });

  if (!lifecycle) {
    throw new Error('Observability lifecycle did not load');
  }

  return lifecycle;
}

describe('observability lifecycle', () => {
  const handlers = new Map<TShutdownSignal, () => Promise<void>>();

  beforeEach(() => {
    handlers.clear();
    jest.clearAllMocks();
    mockFlushSentry.mockResolvedValue(true);
    mockShutdownMetrics.mockResolvedValue(undefined);

    jest.spyOn(process, 'once').mockImplementation((signal, listener) => {
      if (signal === 'SIGINT' || signal === 'SIGTERM') {
        handlers.set(signal, async () => {
          await listener(signal);
        });
      }

      return process;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('registers both signals once and performs one bounded shutdown', async () => {
    const lifecycle = await loadObservabilityLifecycle();

    lifecycle.registerShutdown();
    lifecycle.registerShutdown();
    await handlers.get('SIGTERM')?.();
    await lifecycle.shutdown('SIGINT');

    expect(process.once).toHaveBeenCalledTimes(2);
    expect(mockFlushSentry).toHaveBeenCalledTimes(1);
    expect(mockFlushSentry).toHaveBeenCalledWith(4_000);
    expect(mockShutdownMetrics).toHaveBeenCalledTimes(1);
    expect(mockLogger.warn).not.toHaveBeenCalled();
    expect(Object.isFrozen(lifecycle)).toBe(true);
  });

  it('warns when Sentry cannot flush within the bound', async () => {
    mockFlushSentry.mockResolvedValue(false);
    const lifecycle = await loadObservabilityLifecycle();

    await lifecycle.shutdown('SIGTERM');

    expect(mockLogger.warn).toHaveBeenCalledWith(
      'observability.sentry.flush_failed',
      { outcome: 'failure', signal: 'SIGTERM' }
    );
  });

  it('contains Sentry flush and logger failures', async () => {
    const error = new Error('flush unavailable');
    mockFlushSentry.mockRejectedValue(error);
    mockLogger.warn.mockImplementationOnce(() => {
      throw new Error('logger unavailable');
    });
    const lifecycle = await loadObservabilityLifecycle();

    await expect(lifecycle.shutdown()).resolves.toBeUndefined();
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'observability.sentry.flush_failed',
      { error, outcome: 'failure' }
    );
  });

  it('includes the shutdown signal when a Sentry flush rejects', async () => {
    const error = new Error('flush unavailable');
    mockFlushSentry.mockRejectedValue(error);
    const lifecycle = await loadObservabilityLifecycle();

    await expect(lifecycle.shutdown('SIGTERM')).resolves.toBeUndefined();
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'observability.sentry.flush_failed',
      { error, outcome: 'failure', signal: 'SIGTERM' }
    );
  });

  it('contains unexpected metrics shutdown failures', async () => {
    const error = new Error('metrics unavailable');
    mockShutdownMetrics.mockRejectedValue(error);
    const lifecycle = await loadObservabilityLifecycle();

    await expect(lifecycle.shutdown('SIGINT')).resolves.toBeUndefined();
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'observability.lifecycle.shutdown_failed',
      { error, outcome: 'failure', signal: 'SIGINT' }
    );
  });

  it('omits signal fields from unscoped shutdown failures', async () => {
    const error = new Error('metrics unavailable');
    mockFlushSentry.mockResolvedValue(false);
    mockShutdownMetrics.mockRejectedValue(error);
    const lifecycle = await loadObservabilityLifecycle();

    await expect(lifecycle.shutdown()).resolves.toBeUndefined();
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'observability.sentry.flush_failed',
      { outcome: 'failure' }
    );
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'observability.lifecycle.shutdown_failed',
      { error, outcome: 'failure' }
    );
    expect(mockLogger.warn).toHaveBeenCalledTimes(2);
  });
});
