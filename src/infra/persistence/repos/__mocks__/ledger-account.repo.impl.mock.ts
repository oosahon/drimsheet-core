import ILedgerAccountRepo from '../../../../domain/ledger/repos/ledger-account.repo';

const mockLedgerAccountRepo: jest.Mocked<ILedgerAccountRepo> = {
  save: jest.fn(),
  findById: jest.fn(),
  findByCode: jest.fn(),
};

export default mockLedgerAccountRepo;
