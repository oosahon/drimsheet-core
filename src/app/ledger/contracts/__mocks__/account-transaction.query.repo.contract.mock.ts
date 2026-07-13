import IAccountTransactionQueryRepo from '../account-transaction.query.repo.contract';

const mockAccountTransactionQueryRepo: jest.Mocked<IAccountTransactionQueryRepo> =
  {
    findAllByAccountId: jest.fn(),
  };

export default mockAccountTransactionQueryRepo;
