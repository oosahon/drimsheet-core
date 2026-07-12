import ILedgerAccountRepo from '../../../../../domain/ledger/shared/repos/ledger-account.repo';

const mockLedgerAccountRepo: jest.Mocked<ILedgerAccountRepo> = {
  create: jest.fn(),
  findById: jest.fn(),
  findAllByIds: jest.fn(),
  findByCode: jest.fn(),
  findBySubType: jest.fn(),
  findByBehavior: jest.fn(),
  findLatestBySubType: jest.fn(),
  findAll: jest.fn(),
};

export default mockLedgerAccountRepo;
