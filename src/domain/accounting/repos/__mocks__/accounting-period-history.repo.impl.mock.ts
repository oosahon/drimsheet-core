import IAccountingPeriodHistoryRepo from '../accounting-period-history.repo';

const mockAccountingPeriodHistoryRepo: jest.Mocked<IAccountingPeriodHistoryRepo> =
  {
    save: jest.fn(),
  };

export default mockAccountingPeriodHistoryRepo;
