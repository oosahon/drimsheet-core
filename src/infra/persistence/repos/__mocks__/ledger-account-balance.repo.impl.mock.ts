import ILedgerAccountBalanceRepo from '../../../../domain/bookkeeping/repos/ledger-account-balance.repo';

const mockLedgerAccountBalanceRepo: jest.Mocked<ILedgerAccountBalanceRepo> = {
  create: jest.fn(),
  adjustBalance: jest.fn(),
  findBalanceByAccountId: jest.fn(),
  findAdjustmentsByAccountId: jest.fn(),
  findAllByAccountIds: jest.fn(),
};

export default mockLedgerAccountBalanceRepo;
