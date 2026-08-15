import IHttpMetrics from '@shared/contracts/http-metrics.contract';

const mockHttpMetrics: jest.Mocked<IHttpMetrics> = {
  recordRequestCompleted: jest.fn(),
};

export default mockHttpMetrics;
