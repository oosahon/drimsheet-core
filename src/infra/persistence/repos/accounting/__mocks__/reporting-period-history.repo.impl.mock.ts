import IReportingPeriodHistoryRepo from '../../../../../domain/accounting/repos/reporting-period-history.repo';

const mockReportingPeriodHistoryRepo: jest.Mocked<IReportingPeriodHistoryRepo> =
  {
    save: jest.fn(),
  };

export default mockReportingPeriodHistoryRepo;
