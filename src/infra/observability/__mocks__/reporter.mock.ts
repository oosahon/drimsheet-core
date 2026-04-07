import IReporter from '../../../app/contracts/infra/reporter.contract';

export const MockReporter: jest.Mocked<IReporter> = {
  report: jest.fn(),
};

export default MockReporter;
