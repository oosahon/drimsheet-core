import IAccountTransactionQueryRepo from '../../../../domain/bookkeeping/repos/account-transaction-query.repo';

const mockAccountTransactionQueryRepo: jest.Mocked<IAccountTransactionQueryRepo> =
  {
    findAllByAccountId: jest.fn(),
  };

export default mockAccountTransactionQueryRepo;
