import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';

import makeBetterStackLogRuntime from '@infra/integrations/better-stack/better-stack-log-runtime';
import { IBetterStackConfig } from '@infra/integrations/better-stack/better-stack.config';

const mockFlush = jest.fn<Promise<void>, []>();
const mockTransport = { name: 'better-stack-transport' };

jest.mock('@logtail/node', () => ({
  Logtail: jest.fn(() => ({ flush: mockFlush })),
}));

jest.mock('@logtail/winston', () => ({
  LogtailTransport: jest.fn(() => mockTransport),
}));

function makeConfig(
  overrides: Partial<IBetterStackConfig> = {}
): IBetterStackConfig {
  return {
    enabled: true,
    exportIntervalMs: 60_000,
    logEndpoint: 'https://s123.eu-nbg-2.betterstackdata.com',
    metricsEndpoint: 'https://s123.eu-nbg-2.betterstackdata.com/v1/metrics',
    shutdownTimeoutMs: 5_000,
    sourceToken: 'source-token',
    ...overrides,
  };
}

describe('Better Stack log runtime', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFlush.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('stays inert when Better Stack is disabled', async () => {
    const runtime = makeBetterStackLogRuntime(makeConfig({ enabled: false }));

    await runtime.shutdown();

    expect(Logtail).not.toHaveBeenCalled();
    expect(LogtailTransport).not.toHaveBeenCalled();
    expect(runtime.transport).toBeUndefined();
  });

  it('constructs the official client and Winston transport from one source', () => {
    const runtime = makeBetterStackLogRuntime(makeConfig());

    expect(Logtail).toHaveBeenCalledWith('source-token', {
      endpoint: 'https://s123.eu-nbg-2.betterstackdata.com',
    });
    expect(LogtailTransport).toHaveBeenCalledWith(expect.any(Object));
    expect(runtime.transport).toBe(mockTransport);
    expect(Object.isFrozen(runtime)).toBe(true);
  });

  it('flushes once during repeated shutdown', async () => {
    const runtime = makeBetterStackLogRuntime(makeConfig());

    await runtime.shutdown();
    await runtime.shutdown();

    expect(mockFlush).toHaveBeenCalledTimes(1);
  });

  it('bounds a stalled flush and preserves one rejected shutdown', async () => {
    jest.useFakeTimers();
    mockFlush.mockReturnValue(new Promise(() => undefined));
    const runtime = makeBetterStackLogRuntime(
      makeConfig({ shutdownTimeoutMs: 25 })
    );

    const firstShutdown = runtime.shutdown();
    const secondShutdown = runtime.shutdown();
    const rejection = expect(firstShutdown).rejects.toThrow(
      'Log flush timed out'
    );

    await jest.advanceTimersByTimeAsync(25);

    await rejection;
    await expect(secondShutdown).rejects.toThrow('Log flush timed out');
    expect(mockFlush).toHaveBeenCalledTimes(1);
  });

  it('contains client construction and fallback warning failures', () => {
    jest.mocked(Logtail).mockImplementationOnce(() => {
      throw new Error('client unavailable');
    });
    jest.spyOn(console, 'warn').mockImplementationOnce(() => {
      throw new Error('console unavailable');
    });

    expect(() => makeBetterStackLogRuntime(makeConfig())).not.toThrow();
  });
});
