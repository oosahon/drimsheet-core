import ILedgerAccountBalanceRepo from '../../../../domain/accounting/repos/ledger-account-balance.repo';

const mockLedgerAccountBalanceRepo: jest.Mocked<ILedgerAccountBalanceRepo> = {
  create: jest.fn(),
};

export default mockLedgerAccountBalanceRepo;
