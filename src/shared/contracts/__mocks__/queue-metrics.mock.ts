import IQueueMetrics from '@shared/contracts/queue-metrics.contract';

const mockQueueMetrics: jest.Mocked<IQueueMetrics> = {
  recordEnqueueSucceeded: jest.fn(),
  recordEnqueueFailed: jest.fn(),
  recordProcessingCompleted: jest.fn(),
  recordProcessingFailed: jest.fn(),
};

export default mockQueueMetrics;
