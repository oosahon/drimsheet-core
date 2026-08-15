import IObservabilityMetrics from '@shared/contracts/observability-metrics.contract';

const mockObservabilityMetrics: jest.Mocked<IObservabilityMetrics> = {
  increment: jest.fn(),
  observe: jest.fn(),
  set: jest.fn(),
};

export default mockObservabilityMetrics;
