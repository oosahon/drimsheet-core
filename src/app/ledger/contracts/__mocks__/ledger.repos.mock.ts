import ILedgerAccountBalanceRepo from '../../../../domain/ledger/account-balance/repos/ledger-account-balance.repo';
import IBankAccountRepo from '../../../../domain/ledger/asset-account/repos/bank-account.repo';
import ILedgerAccountHistoryRepo from '../../../../domain/ledger/repos/ledger-account-history.repo';
import ILedgerAccountRepo from '../../../../domain/ledger/repos/ledger-account.repo';

export const mockLedgerAccountBalanceRepo: jest.Mocked<ILedgerAccountBalanceRepo> =
  {
    create: jest.fn(),
    adjustBalance: jest.fn(),
    findByAccountId: jest.fn(),
    findAdjustmentsByAccountId: jest.fn(),
    findAllByAccountIds: jest.fn(),
  };

export const mockBankAccountRepo: jest.Mocked<IBankAccountRepo> = {
  findOne: jest.fn(),
  findByLedgerAccountId: jest.fn(),
  create: jest.fn(),
};

export const mockLedgerAccountHistoryRepo: jest.Mocked<ILedgerAccountHistoryRepo> =
  {
    save: jest.fn(),
  };

export const mockLedgerAccountRepo: jest.Mocked<ILedgerAccountRepo> = {
  create: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findAllByIds: jest.fn(),
  findByCode: jest.fn(),
  findBySubType: jest.fn(),
  findByBehavior: jest.fn(),
  findLatestBySubType: jest.fn(),
  findAll: jest.fn(),
};
