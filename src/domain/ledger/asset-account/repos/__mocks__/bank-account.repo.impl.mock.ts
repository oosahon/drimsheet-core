import IBankAccountRepo from '../bank-account.repo';

const mockBankAccountRepo: jest.Mocked<IBankAccountRepo> = {
  findOne: jest.fn(),
  findByLedgerAccountId: jest.fn(),
  create: jest.fn(),
};

export default mockBankAccountRepo;
