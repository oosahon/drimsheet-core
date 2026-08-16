import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  findCorrelatedLog,
  loadSmokeConfig,
  runSmokeTest,
} from '../observability-smoke-test.mjs';

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('loadSmokeConfig rejects a scenario without queue propagation probes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'observability-smoke-'));
  const probesPath = join(directory, 'probes.json');
  await writeFile(probesPath, JSON.stringify({ queueProbes: [] }));

  await assert.rejects(
    loadSmokeConfig({ OBS_SMOKE_QUEUE_PROBES_FILE: probesPath }),
    /must define queueProbes/
  );
});

test('findCorrelatedLog requires service, environment, event, and correlation ID', () => {
  const matching = {
    event: 'http.request.completed',
    correlationId: 'correlation-id',
    service: 'drimsheet-core',
    environment: 'staging',
  };
  const payload = {
    data: {
      result: [
        {
          values: [
            ['1', JSON.stringify({ ...matching, service: 'another-service' })],
            ['2', JSON.stringify(matching)],
          ],
        },
      ],
    },
  };

  assert.deepEqual(findCorrelatedLog(payload, matching), matching);
});

test('runSmokeTest joins request logs, traces, metrics, queues, and alert delivery', async () => {
  const traceId = 'a'.repeat(32);
  const correlations = [
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000003',
  ];
  let correlationIndex = 0;
  const requestedCorrelations = [];

  const fetchImpl = async (input, init = {}) => {
    const url = new URL(String(input));

    if (url.origin === 'https://core.example.test') {
      if (url.pathname.startsWith('/health/'))
        return new Response('', { status: 200 });

      requestedCorrelations.push(init.headers['x-correlation-id']);
      const status =
        url.searchParams.get('currencyPair') === 'INVALID' ? 422 : 200;
      return jsonResponse({}, status);
    }

    if (url.hostname === 'loki.example.test') {
      const correlationId = correlations.find((value) =>
        url.searchParams.get('query').includes(value)
      );
      return jsonResponse({
        data: {
          result: [
            {
              values: [
                [
                  '1',
                  JSON.stringify({
                    event: 'http.request.completed',
                    service: 'drimsheet-core',
                    environment: 'staging',
                    correlationId,
                    traceId,
                  }),
                ],
              ],
            },
          ],
        },
      });
    }

    if (url.hostname === 'sentry.example.test') {
      return jsonResponse({
        op: 'http.server',
        children: [
          { op: 'app.usecase' },
          { op: 'db.sql.query' },
          {
            op: 'queue.process',
            data: {
              'messaging.destination.name': 'transactional-email-queue',
            },
          },
        ],
      });
    }

    if (url.hostname === 'prometheus.example.test') {
      const query = url.searchParams.get('query');
      const isRabbit = query.includes('rabbitmq_');
      return jsonResponse({
        data: {
          result: [
            {
              metric: isRabbit
                ? { service: 'rabbitmq', environment: 'staging' }
                : {
                    service_name: 'drimsheet-core',
                    deployment_environment_name: 'staging',
                  },
              value: ['1', '1'],
            },
          ],
        },
      });
    }

    if (url.hostname === 'grafana.example.test') {
      return jsonResponse({}, 200);
    }

    throw new Error(`Unexpected request: ${url}`);
  };

  const report = await runSmokeTest(
    {
      coreUrl: 'https://core.example.test',
      service: 'drimsheet-core',
      environment: 'staging',
      prometheusQueryUrl: 'https://prometheus.example.test/api/v1/query',
      prometheusAuthorization: 'Basic redacted',
      lokiQueryUrl: 'https://loki.example.test/loki/api/v1/query_range',
      lokiAuthorization: 'Basic redacted',
      sentryApiUrl: 'https://sentry.example.test',
      sentryOrganization: 'drimsheet',
      sentryAuthorization: 'Bearer redacted',
      alertTestUrl: 'https://grafana.example.test/alert/test',
      alertAuthorization: 'Bearer redacted',
      alertDeliveryConfirmed: true,
      timeoutMs: 1,
      pollIntervalMs: 1,
      queueProbes: [
        {
          name: 'transactional-email',
          method: 'POST',
          path: '/synthetic/email',
          headers: { authorization: 'Bearer redacted' },
          body: { synthetic: true },
          expectedStatus: [200],
          expectedQueues: ['transactional-email-queue'],
        },
      ],
    },
    {
      fetchImpl,
      sleep: async () => {},
      uuid: () => correlations[correlationIndex++],
    }
  );

  assert.equal(report.status, 'passed');
  assert.deepEqual(requestedCorrelations, [
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000003',
  ]);
  assert.ok(report.checks.some((check) => check.name === 'alert.delivery'));
  assert.ok(
    report.checks.some((check) => check.name === 'trace.transactional-email')
  );
});
