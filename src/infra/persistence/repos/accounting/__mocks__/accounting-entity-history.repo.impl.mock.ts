import IAccountingEntityHistoryRepo from '../../../../../domain/accounting/repos/accounting-entity-history.repo';

const mockAccountingEntityHistoryRepo: jest.Mocked<IAccountingEntityHistoryRepo> =
  {
    save: jest.fn(),
  };

export default mockAccountingEntityHistoryRepo;
