import Sentry from '@sentry/node';

import tracer from '@infra/integrations/sentry/sentry-tracer';

jest.mock('@sentry/node', () => ({
  __esModule: true,
  default: {
    continueTrace: jest.fn((_carrier, callback) => callback()),
    getActiveSpan: jest.fn(),
    getTraceData: jest.fn(() => ({})),
    spanToJSON: jest.fn(),
    startNewTrace: jest.fn((callback) => callback()),
    startSpan: jest.fn((_options, callback) => callback()),
  },
}));

describe('tracer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('runs synchronous and asynchronous spans with controlled metadata', async () => {
    expect(
      tracer.startSpan(
        {
          name: 'journalEntry.createReceiptUseCase',
          operation: 'app.usecase',
          attributes: {
            'messaging.system': 'bullmq',
            'messaging.destination.name': 'ledger-balance-adjustment',
          },
        },
        () => 'created'
      )
    ).toBe('created');
    await expect(
      tracer.startSpan(
        {
          name: 'ledger.adjustLedgerAccountBalanceUseCase',
          operation: 'app.usecase',
        },
        async () => 'adjusted'
      )
    ).resolves.toBe('adjusted');

    expect(Sentry.startSpan).toHaveBeenNthCalledWith(
      1,
      {
        name: 'journalEntry.createReceiptUseCase',
        op: 'app.usecase',
        attributes: {
          'messaging.system': 'bullmq',
          'messaging.destination.name': 'ledger-balance-adjustment',
        },
      },
      expect.any(Function)
    );
  });

  it('preserves operation errors and rejected promises', async () => {
    const synchronousError = new Error('use case failed');
    const asynchronousError = new Error('async use case failed');

    expect(() =>
      tracer.startSpan(
        { name: 'auth.loginWithEmailUseCase', operation: 'app.usecase' },
        () => {
          throw synchronousError;
        }
      )
    ).toThrow(synchronousError);
    await expect(
      tracer.startSpan(
        { name: 'auth.loginWithEmailUseCase', operation: 'app.usecase' },
        async () => Promise.reject(asynchronousError)
      )
    ).rejects.toBe(asynchronousError);
  });

  it('falls back exactly once when span setup fails', () => {
    jest.mocked(Sentry.startSpan).mockImplementationOnce(() => {
      throw new Error('SDK setup failed');
    });
    const operation = jest.fn(() => 'result');

    expect(
      tracer.startSpan(
        { name: 'auth.logoutUseCase', operation: 'app.usecase' },
        operation
      )
    ).toBe('result');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('does not repeat completed work when instrumentation fails afterward', () => {
    jest
      .mocked(Sentry.startSpan)
      .mockImplementationOnce((_options, callback) => {
        callback({} as never);
        throw new Error('SDK completion failed');
      });
    const operation = jest.fn(() => 'result');

    expect(
      tracer.startSpan(
        { name: 'auth.logoutUseCase', operation: 'app.usecase' },
        operation
      )
    ).toBe('result');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('starts fresh roots and contains root setup failures', () => {
    const operation = jest.fn(() => 'processed');

    expect(
      tracer.startRootSpan(
        {
          name: 'integration.cbn_exchange_rate',
          operation: 'integration.run',
        },
        operation
      )
    ).toBe('processed');
    expect(Sentry.startNewTrace).toHaveBeenCalledTimes(1);
    expect(Sentry.startSpan).toHaveBeenCalledTimes(1);

    jest.mocked(Sentry.startNewTrace).mockImplementationOnce(() => {
      throw new Error('root setup failed');
    });
    expect(
      tracer.startRootSpan(
        { name: 'queue.ledger_balance', operation: 'queue.process' },
        operation
      )
    ).toBe('processed');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('continues only safe incoming trace carriers', () => {
    const operation = jest.fn(() => 'processed');
    const sentryTrace = `${'a'.repeat(32)}-${'b'.repeat(16)}-1`;

    expect(
      tracer.continueTrace(
        { sentryTrace, baggage: 'sentry-environment=staging' },
        operation
      )
    ).toBe('processed');
    expect(Sentry.continueTrace).toHaveBeenCalledWith(
      { sentryTrace, baggage: 'sentry-environment=staging' },
      expect.any(Function)
    );

    tracer.continueTrace(
      {
        sentryTrace: 'private.person@example.com\r\nsecret',
        baggage: 'private\nheader',
      },
      operation
    );
    expect(Sentry.continueTrace).toHaveBeenCalledTimes(1);
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('contains continuation setup failures without repeating work', () => {
    jest
      .mocked(Sentry.continueTrace)
      .mockImplementationOnce((_carrier, callback) => {
        callback();
        throw new Error('continuation failed');
      });
    const operation = jest.fn(() => 'processed');

    expect(
      tracer.continueTrace(
        { sentryTrace: `${'a'.repeat(32)}-${'b'.repeat(16)}-1` },
        operation
      )
    ).toBe('processed');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('creates a safe propagation carrier and contains SDK failures', () => {
    const sentryTrace = `${'a'.repeat(32)}-${'b'.repeat(16)}-0`;
    jest.mocked(Sentry.getTraceData).mockReturnValue({
      'sentry-trace': sentryTrace,
      baggage: 'sentry-release=release-1',
      traceparent: 'not-used',
    });

    expect(tracer.getPropagationCarrier()).toEqual({
      sentryTrace,
      baggage: 'sentry-release=release-1',
    });

    jest.mocked(Sentry.getTraceData).mockImplementationOnce(() => {
      throw new Error('SDK unavailable');
    });
    expect(tracer.getPropagationCarrier()).toEqual({});
  });

  it('returns only valid active trace identities', () => {
    jest.mocked(Sentry.getActiveSpan).mockReturnValue({} as never);
    jest.mocked(Sentry.spanToJSON).mockReturnValue({
      data: {},
      trace_id: 'a'.repeat(32),
      span_id: 'b'.repeat(16),
      start_timestamp: 1,
    });
    expect(tracer.getActiveTrace()).toEqual({
      traceId: 'a'.repeat(32),
      spanId: 'b'.repeat(16),
    });

    jest.mocked(Sentry.spanToJSON).mockReturnValueOnce({
      data: {},
      trace_id: 'private@example.com',
      span_id: 'private-id',
      start_timestamp: 1,
    });
    expect(tracer.getActiveTrace()).toBeUndefined();

    jest.mocked(Sentry.getActiveSpan).mockReturnValueOnce(undefined);
    expect(tracer.getActiveTrace()).toBeUndefined();

    jest.mocked(Sentry.getActiveSpan).mockImplementationOnce(() => {
      throw new Error('SDK unavailable');
    });
    expect(tracer.getActiveTrace()).toBeUndefined();
  });

  it('normalizes unsafe span metadata and is immutable', () => {
    tracer.startSpan(
      {
        name: 'private.person@example.com',
        operation: 'app.usecase',
        attributes: {
          'messaging.system': 'private/value',
          private: 'private@example.com',
        } as never,
      },
      () => undefined
    );

    expect(Sentry.startSpan).toHaveBeenCalledWith(
      {
        name: 'observability.unnamed',
        op: 'app.usecase',
        attributes: {},
      },
      expect.any(Function)
    );
    expect(Object.isFrozen(tracer)).toBe(true);
  });
});
