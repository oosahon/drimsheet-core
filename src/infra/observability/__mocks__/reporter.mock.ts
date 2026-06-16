import type IReporter from '../../../shared/contracts/reporter.contract';

const mockReporter: jest.Mocked<IReporter> = {
  report: jest.fn(),
  reportAbuse: jest.fn(),
};

export default mockReporter;
export { mockReporter as MockReporter };
