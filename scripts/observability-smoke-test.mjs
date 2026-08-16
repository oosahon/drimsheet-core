#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const APPLICATION_METRICS = [
  'http_server_requests',
  'http_server_request_duration',
  'messaging_client_enqueue_operations',
  'messaging_process_operations',
  'messaging_process_duration',
  'messaging_process_wait_duration',
];

const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_POLL_INTERVAL_MS = 5_000;
const TRACE_ID_PATTERN = /^[0-9a-f]{32}$/;

function required(env, name) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function positiveInteger(value, fallback, name) {
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsed;
}

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, '');
}

function basicAuth(username, password) {
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

function escapeLogQl(value) {
  return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

function asExpectedStatuses(value) {
  const statuses = Array.isArray(value) ? value : [value];

  if (
    statuses.length === 0 ||
    statuses.some((status) => !Number.isInteger(status))
  ) {
    throw new Error('Probe expectedStatus must be an integer or integer array');
  }

  return statuses;
}

function validateProbe(probe, index) {
  if (!probe || typeof probe !== 'object' || Array.isArray(probe)) {
    throw new Error(`queueProbes[${index}] must be an object`);
  }

  if (typeof probe.name !== 'string' || !probe.name.trim()) {
    throw new Error(`queueProbes[${index}].name is required`);
  }

  if (typeof probe.path !== 'string' || !probe.path.startsWith('/')) {
    throw new Error(`queueProbes[${index}].path must start with /`);
  }

  if (!Array.isArray(probe.expectedQueues) || !probe.expectedQueues.length) {
    throw new Error(`queueProbes[${index}].expectedQueues is required`);
  }

  return {
    name: probe.name,
    method: String(probe.method ?? 'POST').toUpperCase(),
    path: probe.path,
    headers: probe.headers ?? {},
    ...(probe.body === undefined ? {} : { body: probe.body }),
    expectedStatus: asExpectedStatuses(probe.expectedStatus ?? 200),
    expectedQueues: probe.expectedQueues.map(String),
  };
}

export async function loadSmokeConfig(env = process.env) {
  const probesPath = required(env, 'OBS_SMOKE_QUEUE_PROBES_FILE');
  const probesDocument = JSON.parse(await readFile(probesPath, 'utf8'));
  const queueProbes = probesDocument.queueProbes?.map(validateProbe) ?? [];

  if (!queueProbes.length) {
    throw new Error('OBS_SMOKE_QUEUE_PROBES_FILE must define queueProbes');
  }

  return {
    coreUrl: normalizeBaseUrl(required(env, 'OBS_SMOKE_CORE_URL')),
    service: env.OBS_SMOKE_SERVICE?.trim() || 'drimsheet-core',
    environment: env.OBS_SMOKE_ENVIRONMENT?.trim() || 'staging',
    prometheusQueryUrl: required(env, 'OBS_SMOKE_PROMETHEUS_QUERY_URL'),
    prometheusAuthorization: basicAuth(
      required(env, 'OBS_SMOKE_PROMETHEUS_USERNAME'),
      required(env, 'OBS_SMOKE_GRAFANA_READ_TOKEN')
    ),
    lokiQueryUrl: required(env, 'OBS_SMOKE_LOKI_QUERY_URL'),
    lokiAuthorization: basicAuth(
      required(env, 'OBS_SMOKE_LOKI_USERNAME'),
      required(env, 'OBS_SMOKE_GRAFANA_READ_TOKEN')
    ),
    sentryApiUrl: normalizeBaseUrl(
      env.OBS_SMOKE_SENTRY_API_URL?.trim() || 'https://sentry.io'
    ),
    sentryOrganization: required(env, 'OBS_SMOKE_SENTRY_ORGANIZATION'),
    sentryAuthorization: `Bearer ${required(env, 'OBS_SMOKE_SENTRY_TOKEN')}`,
    alertTestUrl: required(env, 'OBS_SMOKE_ALERT_TEST_URL'),
    alertAuthorization: `Bearer ${required(
      env,
      'OBS_SMOKE_GRAFANA_ALERT_TOKEN'
    )}`,
    alertBodyPath: env.OBS_SMOKE_ALERT_BODY_FILE?.trim(),
    alertDeliveryConfirmed: env.OBS_SMOKE_ALERT_DELIVERY_CONFIRMED === 'true',
    timeoutMs: positiveInteger(
      env.OBS_SMOKE_TIMEOUT_MS,
      DEFAULT_TIMEOUT_MS,
      'OBS_SMOKE_TIMEOUT_MS'
    ),
    pollIntervalMs: positiveInteger(
      env.OBS_SMOKE_POLL_INTERVAL_MS,
      DEFAULT_POLL_INTERVAL_MS,
      'OBS_SMOKE_POLL_INTERVAL_MS'
    ),
    queueProbes,
  };
}

async function responseJson(response, context) {
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${context} returned HTTP ${response.status}`);
  }

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`${context} returned invalid JSON`);
  }
}

async function poll({
  label,
  operation,
  accept,
  timeoutMs,
  intervalMs,
  sleep,
}) {
  const deadline = Date.now() + timeoutMs;
  let lastError;

  do {
    try {
      const value = await operation();
      if (accept(value)) return value;
      lastError = new Error(`${label} has not arrived yet`);
    } catch (error) {
      lastError = error;
    }

    await sleep(intervalMs);
  } while (Date.now() < deadline);

  throw new Error(`${label} timed out: ${lastError?.message ?? 'no result'}`);
}

function parseLogLine(value) {
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed.log === 'string') return JSON.parse(parsed.log);
    return parsed;
  } catch {
    return undefined;
  }
}

export function findCorrelatedLog(payload, expected) {
  const lines = (payload?.data?.result ?? []).flatMap(
    (stream) => stream.values?.map((entry) => entry[1]) ?? []
  );

  return lines
    .map(parseLogLine)
    .find(
      (record) =>
        record?.correlationId === expected.correlationId &&
        record?.service === expected.service &&
        record?.environment === expected.environment &&
        record?.event === 'http.request.completed'
    );
}

function getOperationsAndQueues(
  value,
  result = { operations: [], queues: [] }
) {
  if (!value || typeof value !== 'object') return result;

  if (typeof value.op === 'string') result.operations.push(value.op);
  if (typeof value.operation === 'string')
    result.operations.push(value.operation);

  const queue =
    value['messaging.destination.name'] ??
    value.data?.['messaging.destination.name'];
  if (typeof queue === 'string') result.queues.push(queue);

  for (const nested of Object.values(value)) {
    if (nested && typeof nested === 'object') {
      getOperationsAndQueues(nested, result);
    }
  }

  return result;
}

function hasOperation(operations, expected) {
  return operations.some(
    (operation) =>
      operation === expected || operation.startsWith(`${expected}.`)
  );
}

function metricHasExpectedLabels(metric, expected) {
  const labels = metric?.metric ?? {};
  const service = labels.service_name ?? labels.service;
  const environment = labels.deployment_environment_name ?? labels.environment;

  return service === expected.service && environment === expected.environment;
}

function hasMetricResult(payload, expected) {
  return (payload?.data?.result ?? []).some((metric) =>
    metricHasExpectedLabels(metric, expected)
  );
}

async function runHttpProbe(config, probe, correlationId, fetchImpl) {
  const response = await fetchImpl(`${config.coreUrl}${probe.path}`, {
    method: probe.method,
    headers: {
      ...probe.headers,
      accept: 'application/json',
      'content-type': 'application/json',
      'x-correlation-id': correlationId,
    },
    ...(probe.body === undefined ? {} : { body: JSON.stringify(probe.body) }),
  });

  if (!probe.expectedStatus.includes(response.status)) {
    throw new Error(
      `${probe.name} returned HTTP ${response.status}; expected ${probe.expectedStatus.join(', ')}`
    );
  }

  return { status: response.status, correlationId };
}

async function findLog(config, correlationId, fetchImpl, sleep) {
  const query = `{environment="${escapeLogQl(config.environment)}"} |= "${escapeLogQl(correlationId)}"`;
  const start = String((Date.now() - config.timeoutMs) * 1_000_000);

  return poll({
    label: `Loki log for ${correlationId}`,
    timeoutMs: config.timeoutMs,
    intervalMs: config.pollIntervalMs,
    sleep,
    operation: async () => {
      const url = new URL(config.lokiQueryUrl);
      url.searchParams.set('query', query);
      url.searchParams.set('start', start);
      url.searchParams.set('limit', '100');

      const response = await fetchImpl(url, {
        headers: { authorization: config.lokiAuthorization },
      });
      return responseJson(response, 'Loki query');
    },
    accept: (payload) =>
      Boolean(
        findCorrelatedLog(payload, {
          correlationId,
          service: config.service,
          environment: config.environment,
        })
      ),
  }).then((payload) =>
    findCorrelatedLog(payload, {
      correlationId,
      service: config.service,
      environment: config.environment,
    })
  );
}

async function findTrace(
  config,
  traceId,
  expectedOperations,
  expectedQueues,
  fetchImpl,
  sleep
) {
  const traceUrl = new URL(
    `${config.sentryApiUrl}/api/0/organizations/${encodeURIComponent(
      config.sentryOrganization
    )}/trace/${traceId}/`
  );
  traceUrl.searchParams.set('statsPeriod', '1h');
  traceUrl.searchParams.append(
    'additional_attributes',
    'messaging.destination.name'
  );

  return poll({
    label: `Sentry trace ${traceId}`,
    timeoutMs: config.timeoutMs,
    intervalMs: config.pollIntervalMs,
    sleep,
    operation: async () => {
      const response = await fetchImpl(traceUrl, {
        headers: { authorization: config.sentryAuthorization },
      });
      return responseJson(response, 'Sentry trace query');
    },
    accept: (payload) => {
      const found = getOperationsAndQueues(payload);
      return (
        expectedOperations.every((op) => hasOperation(found.operations, op)) &&
        expectedQueues.every((queue) => found.queues.includes(queue))
      );
    },
  });
}

async function verifyMetric(config, metricName, service, fetchImpl, sleep) {
  const expected = { service, environment: config.environment };

  return poll({
    label: `Prometheus metric ${metricName}`,
    timeoutMs: config.timeoutMs,
    intervalMs: config.pollIntervalMs,
    sleep,
    operation: async () => {
      const url = new URL(config.prometheusQueryUrl);
      url.searchParams.set('query', `{__name__=~"${metricName}.*"}`);
      const response = await fetchImpl(url, {
        headers: { authorization: config.prometheusAuthorization },
      });
      return responseJson(response, 'Prometheus query');
    },
    accept: (payload) => hasMetricResult(payload, expected),
  });
}

async function checkHealth(config, path, fetchImpl) {
  const response = await fetchImpl(`${config.coreUrl}${path}`);
  if (response.status !== 200) {
    throw new Error(`${path} returned HTTP ${response.status}`);
  }
  return { path, status: response.status };
}

function addCheck(report, name, evidence) {
  report.checks.push({ name, status: 'passed', evidence });
}

export async function runSmokeTest(
  config,
  {
    fetchImpl = fetch,
    sleep = (milliseconds) =>
      new Promise((resolve) => setTimeout(resolve, milliseconds)),
    uuid = randomUUID,
  } = {}
) {
  const report = {
    schemaVersion: 1,
    status: 'running',
    service: config.service,
    environment: config.environment,
    startedAt: new Date().toISOString(),
    checks: [],
  };

  addCheck(
    report,
    'health.live',
    await checkHealth(config, '/health/live', fetchImpl)
  );
  addCheck(
    report,
    'health.ready',
    await checkHealth(config, '/health/ready', fetchImpl)
  );

  const httpProbes = [
    {
      name: 'http.success',
      method: 'GET',
      path: '/api/v1/currencies/exchange-rates?currencyPair=USD%2FNGN',
      expectedStatus: [200],
      expectedQueues: [],
      expectedOperations: ['app.usecase', 'db'],
    },
    {
      name: 'http.rejected',
      method: 'GET',
      path: '/api/v1/currencies/exchange-rates?currencyPair=INVALID',
      expectedStatus: [400, 422],
      expectedQueues: [],
      expectedOperations: ['app.usecase'],
    },
    ...config.queueProbes,
  ];

  for (const probe of httpProbes) {
    const correlationId = uuid();
    const requestEvidence = await runHttpProbe(
      config,
      probe,
      correlationId,
      fetchImpl
    );
    addCheck(report, `request.${probe.name}`, requestEvidence);

    const log = await findLog(config, correlationId, fetchImpl, sleep);
    if (!TRACE_ID_PATTERN.test(log?.traceId ?? '')) {
      throw new Error(`Loki log for ${probe.name} has no valid traceId`);
    }
    addCheck(report, `log.${probe.name}`, {
      event: log.event,
      correlationId,
      traceId: log.traceId,
    });

    const expectedOperations = probe.expectedOperations ?? [
      'app.usecase',
      'queue.process',
    ];
    const trace = await findTrace(
      config,
      log.traceId,
      expectedOperations,
      probe.expectedQueues,
      fetchImpl,
      sleep
    );
    const traceEvidence = getOperationsAndQueues(trace);
    addCheck(report, `trace.${probe.name}`, {
      traceId: log.traceId,
      operations: [...new Set(traceEvidence.operations)],
      queues: [...new Set(traceEvidence.queues)],
    });
  }

  for (const metricName of APPLICATION_METRICS) {
    await verifyMetric(config, metricName, config.service, fetchImpl, sleep);
    addCheck(report, `metric.${metricName}`, { metricName });
  }

  await verifyMetric(
    config,
    'bullmq_job_count',
    config.service,
    fetchImpl,
    sleep
  );
  addCheck(report, 'metric.bullmq_job_count', {
    metricName: 'bullmq_job_count',
  });

  await verifyMetric(config, 'rabbitmq_', 'rabbitmq', fetchImpl, sleep);
  addCheck(report, 'metric.rabbitmq_inventory', {
    metricNamePrefix: 'rabbitmq_',
  });

  const alertBody = config.alertBodyPath
    ? JSON.parse(await readFile(config.alertBodyPath, 'utf8'))
    : {};
  const alertResponse = await fetchImpl(config.alertTestUrl, {
    method: 'POST',
    headers: {
      authorization: config.alertAuthorization,
      'content-type': 'application/json',
    },
    body: JSON.stringify(alertBody),
  });
  if (!alertResponse.ok) {
    throw new Error(`Grafana alert test returned HTTP ${alertResponse.status}`);
  }
  addCheck(report, 'alert.test_accepted', { status: alertResponse.status });

  if (!config.alertDeliveryConfirmed) {
    throw new Error(
      'Alert test was accepted, but delivery is unconfirmed; set OBS_SMOKE_ALERT_DELIVERY_CONFIRMED=true only after checking the destination'
    );
  }
  addCheck(report, 'alert.delivery', { confirmedByOperator: true });

  report.status = 'passed';
  report.finishedAt = new Date().toISOString();
  return report;
}

async function main() {
  try {
    const config = await loadSmokeConfig();

    if (process.argv.includes('--check-config')) {
      console.log(
        JSON.stringify(
          {
            status: 'valid',
            service: config.service,
            environment: config.environment,
            queueProbes: config.queueProbes.map((probe) => probe.name),
          },
          null,
          2
        )
      );
      return;
    }

    const report = await runSmokeTest(config);
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    console.error(
      JSON.stringify(
        { status: 'failed', error: error?.message ?? String(error) },
        null,
        2
      )
    );
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main();
}
