import IReportingPeriodRepo from '../../../../../domain/accounting/repos/reporting-period.repo';

const mockReportingPeriodRepo: jest.Mocked<IReportingPeriodRepo> = {
  save: jest.fn(),
};

export default mockReportingPeriodRepo;
