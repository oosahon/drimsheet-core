import ILedgerAccountPersistenceService from '../../types/ledger-account-persistence.service.types';

const mockLedgerAccountPersistenceService: jest.Mocked<ILedgerAccountPersistenceService> =
  {
    create: jest.fn(),
  };

export default mockLedgerAccountPersistenceService;
