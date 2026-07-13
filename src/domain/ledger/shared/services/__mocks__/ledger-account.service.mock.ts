import { ILedgerAccountService } from '../../types/ledger-account.service.types';

const mockLedgerAccountService: jest.Mocked<ILedgerAccountService> = {
  validateAccountAccess: jest.fn(),
};

export default mockLedgerAccountService;
