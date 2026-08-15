function defineCounter(
  name: string,
  description: string,
  unit: string,
  allowedAttributes: readonly string[]
) {
  return Object.freeze({
    instrument: 'counter' as const,
    metadata: Object.freeze({ name, description, unit }),
    allowedAttributes: Object.freeze(allowedAttributes),
  });
}

function defineHistogram(
  name: string,
  description: string,
  unit: string,
  allowedAttributes: readonly string[],
  explicitFallbackBoundariesSeconds: readonly number[]
) {
  return Object.freeze({
    instrument: 'histogram' as const,
    metadata: Object.freeze({ name, description, unit }),
    allowedAttributes: Object.freeze(allowedAttributes),
    aggregation: Object.freeze({
      preferred: 'base2_exponential' as const,
      explicitFallbackBoundariesSeconds: Object.freeze(
        explicitFallbackBoundariesSeconds
      ),
    }),
  });
}

const metricCatalogue = Object.freeze({
  HTTP_REQUESTS: defineCounter(
    'http.server.requests',
    'Completed HTTP server requests',
    '{request}',
    ['method', 'route', 'status_class', 'outcome']
  ),
  HTTP_REQUEST_DURATION: defineHistogram(
    'http.server.request.duration',
    'HTTP server request duration',
    's',
    ['method', 'route', 'status_class', 'outcome'],
    [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
  ),
  MESSAGING_ENQUEUE_OPERATIONS: defineCounter(
    'messaging.client.enqueue.operations',
    'Messaging enqueue operations',
    '{operation}',
    ['queue', 'transport', 'outcome']
  ),
  MESSAGING_PROCESS_OPERATIONS: defineCounter(
    'messaging.process.operations',
    'Messaging processing operations',
    '{operation}',
    ['queue', 'transport', 'outcome', 'attempt']
  ),
  MESSAGING_PROCESS_DURATION: defineHistogram(
    'messaging.process.duration',
    'Messaging processing duration',
    's',
    ['queue', 'transport', 'outcome'],
    [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60]
  ),
  MESSAGING_PROCESS_WAIT_DURATION: defineHistogram(
    'messaging.process.wait.duration',
    'Messaging processing wait duration',
    's',
    ['queue', 'transport'],
    [0.1, 0.5, 1, 5, 15, 30, 60, 300, 900]
  ),
});

export default metricCatalogue;
