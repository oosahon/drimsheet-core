import ILedgerAccountBalanceRepo from '../../../../../domain/ledger/repos/ledger-account-balance.repo';

const mockLedgerAccountBalanceRepo: jest.Mocked<ILedgerAccountBalanceRepo> = {
  create: jest.fn(),
  adjustBalance: jest.fn(),
  findByAccountId: jest.fn(),
  findAdjustmentsByAccountId: jest.fn(),
  findAllByAccountIds: jest.fn(),
};

export default mockLedgerAccountBalanceRepo;
