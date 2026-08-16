import mockTracer from '@shared/contracts/__mocks__/tracer.mock';

import {
  makeTraceEnvelope,
  traceQueueProcessing,
  unwrapTraceEnvelope,
} from '@infra/messaging/trace-context';

describe('messaging trace context', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTracer.getPropagationCarrier.mockReturnValue({});
    mockTracer.continueTrace.mockImplementation((_carrier, operation) =>
      operation()
    );
    mockTracer.startRootSpan.mockImplementation((_options, operation) =>
      operation()
    );
    mockTracer.startSpan.mockImplementation((_options, operation) =>
      operation()
    );
  });

  it('envelopes an application payload with active propagation context', () => {
    const payload = { correlationId: 'application-correlation' };
    const carrier = {
      sentryTrace: `${'a'.repeat(32)}-${'b'.repeat(16)}-1`,
      baggage: 'sentry-environment=staging',
    };
    mockTracer.getPropagationCarrier.mockReturnValue(carrier);

    const envelope = makeTraceEnvelope(payload, mockTracer);

    expect(envelope).toEqual({
      __observabilityEnvelopeVersion: 1,
      payload,
      trace: carrier,
    });
    expect(Object.isFrozen(envelope)).toBe(true);
    expect(Object.isFrozen(envelope.trace)).toBe(true);
  });

  it('contains propagation failure and preserves enqueue payload', () => {
    const payload = { correlationId: 'application-correlation' };
    mockTracer.getPropagationCarrier.mockImplementationOnce(() => {
      throw new Error('tracer unavailable');
    });

    expect(makeTraceEnvelope(payload, mockTracer)).toEqual({
      __observabilityEnvelopeVersion: 1,
      payload,
    });
  });

  it('unwraps new envelopes and legacy raw payloads', () => {
    const payload = { correlationId: 'application-correlation' };

    expect(
      unwrapTraceEnvelope({
        __observabilityEnvelopeVersion: 1,
        payload,
        trace: {
          sentryTrace: 'trace-header',
          baggage: 'baggage-header',
        },
      })
    ).toEqual({
      payload,
      trace: {
        sentryTrace: 'trace-header',
        baggage: 'baggage-header',
      },
    });
    expect(unwrapTraceEnvelope(payload)).toEqual({ payload, trace: {} });
    expect(
      unwrapTraceEnvelope({
        __observabilityEnvelopeVersion: 1,
        payload,
      })
    ).toEqual({ payload, trace: {} });
  });

  it('drops malformed envelope trace fields', () => {
    const payload = { correlationId: 'application-correlation' };

    expect(
      unwrapTraceEnvelope({
        __observabilityEnvelopeVersion: 1,
        payload,
        trace: { sentryTrace: 42, baggage: {} },
      } as never)
    ).toEqual({ payload, trace: {} });
    expect(
      unwrapTraceEnvelope({ __observabilityEnvelopeVersion: 1 } as never)
    ).toEqual({
      payload: { __observabilityEnvelopeVersion: 1 },
      trace: {},
    });
  });

  it('continues incoming queue traces with controlled root metadata', () => {
    const carrier = { sentryTrace: 'trace-header' };
    const operation = jest.fn(() => 'processed');

    expect(
      traceQueueProcessing(
        mockTracer,
        'pl-core.exchange-rate.ingested',
        'rabbitmq',
        carrier,
        operation
      )
    ).toBe('processed');
    expect(mockTracer.continueTrace).toHaveBeenCalledWith(
      carrier,
      expect.any(Function)
    );
    expect(mockTracer.startSpan).toHaveBeenCalledWith(
      {
        name: 'queue.pl_core_exchange_rate_ingested',
        operation: 'queue.process',
        attributes: {
          'messaging.destination.name': 'pl-core.exchange-rate.ingested',
          'messaging.operation.type': 'process',
          'messaging.system': 'rabbitmq',
        },
      },
      operation
    );
  });

  it('creates a fresh root for messages without trace context', () => {
    const operation = jest.fn(() => 'processed');

    expect(
      traceQueueProcessing(mockTracer, '---', 'bullmq', {}, operation)
    ).toBe('processed');
    expect(mockTracer.startRootSpan).toHaveBeenCalledWith(
      {
        name: 'queue.unknown',
        operation: 'queue.process',
        attributes: {
          'messaging.destination.name': '---',
          'messaging.operation.type': 'process',
          'messaging.system': 'bullmq',
        },
      },
      operation
    );
    expect(mockTracer.continueTrace).not.toHaveBeenCalled();
  });

  it('trims only edge underscores from normalized queue span names', () => {
    const operation = jest.fn(() => 'processed');

    traceQueueProcessing(
      mockTracer,
      '___ledger__balance___',
      'bullmq',
      {},
      operation
    );

    expect(mockTracer.startRootSpan).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'queue.ledger__balance' }),
      operation
    );
  });
});
