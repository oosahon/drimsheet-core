import IAccountingPeriodHistoryRepo from '../../../../../domain/accounting/repos/accounting-period-history.repo';

const mockAccountingPeriodHistoryRepo: jest.Mocked<IAccountingPeriodHistoryRepo> =
  {
    save: jest.fn(),
  };

export default mockAccountingPeriodHistoryRepo;
