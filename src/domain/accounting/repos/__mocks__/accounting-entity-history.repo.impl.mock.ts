import IAccountingEntityHistoryRepo from '../accounting-entity-history.repo';

const mockAccountingEntityHistoryRepo: jest.Mocked<IAccountingEntityHistoryRepo> =
  {
    save: jest.fn(),
  };

export default mockAccountingEntityHistoryRepo;
