import IReporter from '../reporter.contract';

export const MockReporter: jest.Mocked<IReporter> = {
  report: jest.fn(),
};
