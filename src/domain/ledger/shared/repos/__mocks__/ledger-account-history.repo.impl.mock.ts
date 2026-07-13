import ILedgerAccountHistoryRepo from '../ledger-account-history.repo';

const mockLedgerAccountHistoryRepo: jest.Mocked<ILedgerAccountHistoryRepo> = {
  save: jest.fn(),
};

export default mockLedgerAccountHistoryRepo;
