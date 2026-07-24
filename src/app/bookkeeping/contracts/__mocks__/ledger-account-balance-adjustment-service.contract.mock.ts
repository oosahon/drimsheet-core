import { ILedgerAccountBalancePropagationService } from '../ledger-account-balance-adjustment-service.contract';

const mockLedgerAccountBalancePropagationService: jest.Mocked<ILedgerAccountBalancePropagationService> =
  {
    propagate: jest.fn().mockResolvedValue(undefined),
  };

export default mockLedgerAccountBalancePropagationService;
