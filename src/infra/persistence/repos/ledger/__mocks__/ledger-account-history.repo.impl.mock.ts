import ILedgerAccountHistoryRepo from '../../../../../domain/ledger/shared/repos/ledger-account-history.repo';

const mockLedgerAccountHistoryRepo: jest.Mocked<ILedgerAccountHistoryRepo> = {
  save: jest.fn(),
};

export default mockLedgerAccountHistoryRepo;
