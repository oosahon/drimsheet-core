import IReportingPeriodRepo from '../../../../../domain/accounting/repos/reporting-period.repo';

const mockReportingPeriodRepo: jest.Mocked<IReportingPeriodRepo> = {
  create: jest.fn(),
};

export default mockReportingPeriodRepo;
