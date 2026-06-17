import IReportingContextRepo from '../../../../../domain/accounting/repos/reporting-context.repo';

const mockReportingContextRepo: jest.Mocked<IReportingContextRepo> = {
  create: jest.fn(),
};

export default mockReportingContextRepo;
