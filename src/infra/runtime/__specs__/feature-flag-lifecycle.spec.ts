import launchDarklyClient from '@infra/config/launchdarkly.config';
import reporter from '@infra/observability/reporter';
import featureFlagLifeCycle from '@infra/runtime/feature-flag-lifecycle';

jest.mock('@infra/config/launchdarkly.config', () => ({
  __esModule: true,
  default: {
    waitForInitialization: jest.fn(),
    flush: jest.fn(),
    close: jest.fn(),
  },
}));

jest.mock('@infra/observability/reporter', () => ({
  __esModule: true,
  default: {
    report: jest.fn(),
    reportAbuse: jest.fn(),
  },
}));

type TShutdownSignal = 'SIGINT' | 'SIGTERM';

describe('featureFlagLifeCycle', () => {
  const handlers = new Map<TShutdownSignal, () => Promise<void>>();
  const client = jest.mocked(launchDarklyClient);
  const mockReporter = jest.mocked(reporter);

  const getHandler = (signal: TShutdownSignal) => {
    const handler = handlers.get(signal);

    if (!handler) {
      throw new Error(`Missing ${signal} handler`);
    }

    return handler;
  };

  beforeEach(() => {
    handlers.clear();
    jest.clearAllMocks();

    client.waitForInitialization.mockResolvedValue(client);
    client.flush.mockResolvedValue(undefined);
    client.close.mockReturnValue(undefined);

    jest.spyOn(process, 'once').mockImplementation((signal, listener) => {
      if (signal === 'SIGINT' || signal === 'SIGTERM') {
        handlers.set(signal, async () => {
          await listener(signal);
        });
      }

      return process;
    });

    jest.spyOn(process, 'exit').mockImplementation((code): never => {
      throw new Error(`process-exit:${code}`);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('waits for bounded initialization', async () => {
    await featureFlagLifeCycle.initialize();

    expect(client.waitForInitialization).toHaveBeenCalledWith({ timeout: 5 });
    expect(mockReporter.report).not.toHaveBeenCalled();
  });

  it('reports initialization failure and continues', async () => {
    const error = new Error('initialization failed');
    client.waitForInitialization.mockRejectedValue(error);

    await expect(featureFlagLifeCycle.initialize()).resolves.toBeUndefined();
    expect(mockReporter.report).toHaveBeenCalledWith(error, {
      source: 'feature-flag-initialization',
    });
  });

  it('registers SIGINT and SIGTERM shutdown handling', () => {
    featureFlagLifeCycle.registerShutdown();

    expect(process.once).toHaveBeenCalledTimes(2);
    expect(handlers.has('SIGINT')).toBe(true);
    expect(handlers.has('SIGTERM')).toBe(true);
  });

  it.each([
    ['SIGINT', 130],
    ['SIGTERM', 143],
  ] as const)('flushes, closes, and exits on %s', async (signal, exitCode) => {
    featureFlagLifeCycle.registerShutdown();

    await expect(getHandler(signal)()).rejects.toThrow(
      `process-exit:${exitCode}`
    );
    expect(client.flush).toHaveBeenCalledTimes(1);
    expect(client.close).toHaveBeenCalledTimes(1);
    expect(client.flush.mock.invocationCallOrder[0]).toBeLessThan(
      client.close.mock.invocationCallOrder[0]
    );
    expect(process.exit).toHaveBeenCalledWith(exitCode);
  });

  it('reports a flush failure before closing and exiting', async () => {
    const error = new Error('flush failed');
    client.flush.mockRejectedValue(error);
    featureFlagLifeCycle.registerShutdown();

    await expect(getHandler('SIGTERM')()).rejects.toThrow('process-exit:143');
    expect(mockReporter.report).toHaveBeenCalledWith(error, {
      operation: 'flush',
      signal: 'SIGTERM',
      source: 'feature-flag-shutdown',
    });
    expect(client.close).toHaveBeenCalledTimes(1);
    expect(process.exit).toHaveBeenCalledWith(143);
  });

  it('reports a close failure before exiting', async () => {
    const error = new Error('close failed');
    client.close.mockImplementation(() => {
      throw error;
    });
    featureFlagLifeCycle.registerShutdown();

    await expect(getHandler('SIGINT')()).rejects.toThrow('process-exit:130');
    expect(mockReporter.report).toHaveBeenCalledWith(error, {
      operation: 'close',
      signal: 'SIGINT',
      source: 'feature-flag-shutdown',
    });
    expect(process.exit).toHaveBeenCalledWith(130);
  });

  it('is immutable', () => {
    expect(Object.isFrozen(featureFlagLifeCycle)).toBe(true);
  });
});
