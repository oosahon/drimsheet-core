import ILedgerAccountRepo from '../../../../domain/ledger/repos/ledger-account.repo';

const mockLedgerAccountRepo: jest.Mocked<ILedgerAccountRepo> = {
  save: jest.fn(),
  findById: jest.fn(),
  findByCode: jest.fn(),
  findBySubType: jest.fn(),
  findByBehavior: jest.fn(),
  findLatestBySubType: jest.fn(),
  findAll: jest.fn(),
};

export default mockLedgerAccountRepo;
