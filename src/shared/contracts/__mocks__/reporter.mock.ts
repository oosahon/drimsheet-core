import type IReporter from '../reporter.contract';

const mockReporter: jest.Mocked<IReporter> = {
  report: jest.fn(),
  reportAbuse: jest.fn(),
};

export default mockReporter;
export { mockReporter as MockReporter };
