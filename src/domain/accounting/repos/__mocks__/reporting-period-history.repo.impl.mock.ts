import IReportingPeriodHistoryRepo from '../reporting-period-history.repo';

const mockReportingPeriodHistoryRepo: jest.Mocked<IReportingPeriodHistoryRepo> =
  {
    save: jest.fn(),
  };

export default mockReportingPeriodHistoryRepo;
