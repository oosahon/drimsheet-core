import mockObservabilityMetrics from '@shared/contracts/__mocks__/observability-metrics.mock';

import makeHttpMetrics from '@infra/observability/http-metrics';

describe('HTTP metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('records the stable request count and duration in seconds', () => {
    const httpMetrics = makeHttpMetrics(mockObservabilityMetrics);

    httpMetrics.recordRequestCompleted({
      method: 'get',
      route: '/api/v1/users/:userId',
      statusCode: 204,
      outcome: 'success',
      durationMs: 250,
    });

    const attributes = {
      method: 'GET',
      route: '/api/v1/users/:userId',
      status_class: '2xx',
      outcome: 'success',
    };
    expect(mockObservabilityMetrics.increment).toHaveBeenCalledWith({
      name: 'http.server.requests',
      description: 'Completed HTTP server requests',
      unit: '{request}',
      value: 1,
      attributes,
    });
    expect(mockObservabilityMetrics.observe).toHaveBeenCalledWith({
      name: 'http.server.request.duration',
      description: 'HTTP server request duration',
      unit: 's',
      value: 0.25,
      attributes,
    });
  });

  it('bounds invalid status codes without adding identifiers or raw URLs', () => {
    const httpMetrics = makeHttpMetrics(mockObservabilityMetrics);

    httpMetrics.recordRequestCompleted({
      method: 'GET',
      route: 'unmatched',
      statusCode: 700,
      outcome: 'failure',
      durationMs: 1,
    });

    expect(mockObservabilityMetrics.increment).toHaveBeenCalledWith(
      expect.objectContaining({
        attributes: {
          method: 'GET',
          route: 'unmatched',
          status_class: 'unknown',
          outcome: 'failure',
        },
      })
    );
  });
});
