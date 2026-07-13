import IReportingContextRepo from '../reporting-context.repo';

const mockReportingContextRepo: jest.Mocked<IReportingContextRepo> = {
  create: jest.fn(),
};

export default mockReportingContextRepo;
