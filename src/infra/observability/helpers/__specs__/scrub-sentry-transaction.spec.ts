import type { NodeOptions } from '@sentry/node';

import scrubSentryTransaction from '@infra/observability/helpers/scrub-sentry-transaction';

type TSentryTransaction = Parameters<
  NonNullable<NodeOptions['beforeSendTransaction']>
>[0];

const eventId = 'd'.repeat(32);
const traceId = 'a'.repeat(32);
const spanId = 'b'.repeat(16);
const parentSpanId = 'c'.repeat(16);
const childSpanId = 'e'.repeat(16);

describe('scrubSentryTransaction', () => {
  it('preserves a normalized route and removes private request data', () => {
    const event: TSentryTransaction = {
      type: 'transaction',
      event_id: eventId,
      transaction: 'POST /api/v1/journal-entries/:journalEntryId',
      transaction_info: { source: 'route' },
      timestamp: 101,
      start_timestamp: 100,
      platform: 'node',
      release: 'release-id',
      environment: 'staging',
      request: {
        method: 'POST',
        url: 'https://api.example.com/private-id?token=private',
        headers: { authorization: 'Bearer private' },
        data: { amount: 100, email: 'private@example.com' },
      },
      contexts: {
        trace: {
          trace_id: traceId,
          span_id: spanId,
          parent_span_id: parentSpanId,
          op: 'http.server',
          status: 'ok',
          origin: 'auto.http',
          data: { url: 'https://api.example.com/private-id' },
        },
        device: { name: 'private-device' },
      },
      spans: [
        {
          data: { 'db.statement': 'select private@example.com' },
          description: 'SELECT private@example.com',
          op: 'db.query',
          trace_id: traceId,
          span_id: childSpanId,
          start_timestamp: 100,
          timestamp: 101,
        },
      ],
      user: { id: 'private-user-id', email: 'private@example.com' },
      tags: { userId: 'private-user-id' },
      extra: { amount: 100 },
      measurements: { private_amount: { value: 100, unit: 'none' } },
    };

    const scrubbed = scrubSentryTransaction(event);

    expect(scrubbed).toEqual({
      type: 'transaction',
      event_id: eventId,
      transaction: 'POST /api/v1/journal-entries/:journalEntryId',
      transaction_info: { source: 'route' },
      timestamp: 101,
      start_timestamp: 100,
      platform: 'node',
      release: 'release-id',
      environment: 'staging',
      request: { method: 'POST' },
      contexts: {
        trace: {
          trace_id: traceId,
          span_id: spanId,
          parent_span_id: parentSpanId,
          op: 'http.server',
          status: 'ok',
          origin: 'auto.http',
        },
      },
      spans: [
        {
          data: {},
          description: 'database.query',
          op: 'db.query',
          trace_id: traceId,
          span_id: childSpanId,
          start_timestamp: 100,
          timestamp: 101,
        },
      ],
    });
    expect(JSON.stringify(scrubbed)).not.toContain('private@example.com');
    expect(JSON.stringify(scrubbed)).not.toContain('private-user-id');
    expect(JSON.stringify(scrubbed)).not.toContain('amount');
  });

  it('preserves controlled custom transaction names', () => {
    expect(
      scrubSentryTransaction({
        type: 'transaction',
        transaction: 'queue.ledger_balance_adjustment',
        transaction_info: { source: 'custom' },
      })
    ).toEqual({
      type: 'transaction',
      transaction: 'queue.ledger_balance_adjustment',
      transaction_info: { source: 'custom' },
    });
  });

  it('normalizes raw URL transactions and drops their source', () => {
    expect(
      scrubSentryTransaction({
        type: 'transaction',
        transaction: 'GET /users/private-user-id?token=private',
        transaction_info: { source: 'url' },
      })
    ).toEqual({
      type: 'transaction',
      transaction: 'http.unmatched',
    });
  });

  it('drops malformed request, event, release, and trace identity', () => {
    expect(
      scrubSentryTransaction({
        type: 'transaction',
        event_id: 'private.person@example.com',
        transaction: 'private.person@example.com',
        request: { method: 'PRIVATE' },
        release: 'private/release',
        environment: 'private environment',
        platform: 'private/platform',
        contexts: {
          trace: {
            trace_id: 'private.person@example.com',
            span_id: 'private-span-id',
          },
        },
      })
    ).toEqual({
      type: 'transaction',
      transaction: 'http.unmatched',
    });
  });

  it('preserves required trace identity without optional trace metadata', () => {
    expect(
      scrubSentryTransaction({
        type: 'transaction',
        contexts: {
          trace: {
            trace_id: traceId,
            span_id: spanId,
          },
        },
      })
    ).toEqual({
      type: 'transaction',
      transaction: 'http.unmatched',
      contexts: {
        trace: {
          trace_id: traceId,
          span_id: spanId,
        },
      },
    });
  });

  it.each(['GET /health/live', '/health/ready'])(
    'suppresses the health transaction %s',
    (transaction) => {
      expect(
        scrubSentryTransaction({ type: 'transaction', transaction })
      ).toBeNull();
    }
  );

  it('returns a deterministic minimal transaction when scrubbing fails', () => {
    const malformedTransaction = new Proxy(
      {},
      {
        get() {
          throw new Error('private.person@example.com');
        },
      }
    ) as TSentryTransaction;

    expect(scrubSentryTransaction(malformedTransaction)).toEqual({
      type: 'transaction',
      transaction: 'http.unmatched',
    });
  });
});
