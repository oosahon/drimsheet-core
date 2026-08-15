import metricCatalogue from '@infra/observability/metric-catalogue';

describe('metric catalogue', () => {
  it('keeps stable names, instruments, units, and controlled attributes', () => {
    expect(metricCatalogue.HTTP_REQUESTS).toEqual(
      expect.objectContaining({
        instrument: 'counter',
        metadata: expect.objectContaining({
          name: 'http.server.requests',
          unit: '{request}',
        }),
        allowedAttributes: ['method', 'route', 'status_class', 'outcome'],
      })
    );
    expect(metricCatalogue.MESSAGING_PROCESS_OPERATIONS).toEqual(
      expect.objectContaining({
        instrument: 'counter',
        metadata: expect.objectContaining({
          name: 'messaging.process.operations',
          unit: '{operation}',
        }),
        allowedAttributes: ['queue', 'transport', 'outcome', 'attempt'],
      })
    );
    expect(
      new Set(
        Object.values(metricCatalogue).map((metric) => metric.metadata.name)
      ).size
    ).toBe(Object.keys(metricCatalogue).length);
  });

  it('records exponential aggregation and the approved compatibility fallback', () => {
    expect(metricCatalogue.HTTP_REQUEST_DURATION.aggregation).toEqual({
      preferred: 'base2_exponential',
      explicitFallbackBoundariesSeconds: [
        0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
      ],
    });
    expect(
      metricCatalogue.MESSAGING_PROCESS_DURATION.aggregation.preferred
    ).toBe('base2_exponential');
    expect(
      metricCatalogue.MESSAGING_PROCESS_WAIT_DURATION.aggregation
        .explicitFallbackBoundariesSeconds
    ).toEqual([0.1, 0.5, 1, 5, 15, 30, 60, 300, 900]);
  });
});
