import IAccountTransactionQueryRepo from '../../../../../../app/bookkeeping/contracts/account-transaction.query.repo.contract';

const mockAccountTransactionQueryRepo: jest.Mocked<IAccountTransactionQueryRepo> =
  {
    findAllByAccountId: jest.fn(),
  };

export default mockAccountTransactionQueryRepo;
