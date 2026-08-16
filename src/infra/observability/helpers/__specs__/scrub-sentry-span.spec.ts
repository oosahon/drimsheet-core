import type { NodeOptions } from '@sentry/node';

import scrubSentrySpan from '@infra/observability/helpers/scrub-sentry-span';

type TSentrySpan = Parameters<NonNullable<NodeOptions['beforeSendSpan']>>[0];

const traceId = 'a'.repeat(32);
const spanId = 'b'.repeat(16);
const parentSpanId = 'c'.repeat(16);

function makeSpan(overrides: Partial<TSentrySpan> = {}): TSentrySpan {
  return {
    data: {},
    trace_id: traceId,
    span_id: spanId,
    start_timestamp: 100,
    ...overrides,
  };
}

describe('scrubSentrySpan', () => {
  it('preserves controlled use-case identity and bounded attributes', () => {
    const span = makeSpan({
      description: 'journalEntry.createReceiptUseCase',
      op: 'app.usecase',
      parent_span_id: parentSpanId,
      status: 'ok',
      timestamp: 101,
      origin: 'manual',
      data: {
        'http.request.method': 'POST',
        'http.response.status_code': 201,
        'http.route': '/api/v1/journal-entries/:journalEntryId',
        'messaging.system': 'bullmq',
        'messaging.destination.name': 'ledger-balance-adjustment',
        'db.system.name': 'postgresql',
        'url.full':
          'https://api.example.com/private-id?email=private@example.com',
        'db.statement': 'select * from users where email=private@example.com',
        amount: 100,
        userId: 'private-user-id',
      },
      measurements: { private_amount: { value: 100, unit: 'none' } },
      links: [],
    });

    expect(scrubSentrySpan(span)).toEqual({
      data: {
        'db.system.name': 'postgresql',
        'http.request.method': 'POST',
        'http.route': '/api/v1/journal-entries/:journalEntryId',
        'messaging.destination.name': 'ledger-balance-adjustment',
        'messaging.system': 'bullmq',
        'http.response.status_code': 201,
      },
      description: 'journalEntry.createReceiptUseCase',
      op: 'app.usecase',
      origin: 'manual',
      parent_span_id: parentSpanId,
      span_id: spanId,
      start_timestamp: 100,
      status: 'ok',
      timestamp: 101,
      trace_id: traceId,
    });
    expect(JSON.stringify(scrubSentrySpan(span))).not.toContain(
      'private@example.com'
    );
    expect(JSON.stringify(scrubSentrySpan(span))).not.toContain(
      'private-user-id'
    );
    expect(JSON.stringify(scrubSentrySpan(span))).not.toContain('amount');
  });

  it.each([
    [
      'http.client',
      'GET https://api.example.com/users/private-id',
      'http.request',
    ],
    ['db.query', 'SELECT * FROM private_table', 'database.query'],
    ['cache.get', 'GET private-user-id', 'cache.operation'],
    ['messaging.publish', 'private-job-id', 'queue.operation'],
  ])('normalizes %s descriptions', (op, description, expectedDescription) => {
    expect(scrubSentrySpan(makeSpan({ op, description })).description).toBe(
      expectedDescription
    );
  });

  it('drops malformed attributes and arbitrary descriptions', () => {
    const scrubbed = scrubSentrySpan(
      makeSpan({
        description: 'private.person@example.com',
        op: 'custom',
        data: {
          'http.request.method': 'PRIVATE private@example.com',
          'http.response.status_code': 999,
          'http.route': '/users/private-id?token=private',
          'messaging.system': 'rabbitmq/private-user-id',
        },
      })
    );

    expect(scrubbed.description).toBeUndefined();
    expect(scrubbed.data).toEqual({});
  });

  it('replaces malformed span identity, timing, and trace metadata', () => {
    expect(
      scrubSentrySpan(
        makeSpan({
          data: undefined as never,
          trace_id: 'private.person@example.com',
          span_id: 'private-span-id',
          parent_span_id: 'private-parent-id',
          start_timestamp: Number.NaN,
          timestamp: Number.NaN,
          op: 'private/value',
          status: 'private value',
          origin: 'private/value' as never,
        })
      )
    ).toEqual({
      data: {},
      trace_id: '0'.repeat(32),
      span_id: '0'.repeat(16),
      start_timestamp: 0,
    });
  });

  it('returns a deterministic minimal span when scrubbing fails', () => {
    const malformedSpan = new Proxy(
      {},
      {
        get() {
          throw new Error('private.person@example.com');
        },
      }
    ) as TSentrySpan;

    expect(scrubSentrySpan(malformedSpan)).toEqual({
      data: {},
      trace_id: '0'.repeat(32),
      span_id: '0'.repeat(16),
      start_timestamp: 0,
    });
  });
});
