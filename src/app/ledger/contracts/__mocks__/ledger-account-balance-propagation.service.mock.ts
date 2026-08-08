import { ILedgerAccountBalancePropagationService } from '@app/ledger/contracts/ledger-account-balance-propagation.service.contract';

const mockLedgerAccountBalancePropagationService: jest.Mocked<ILedgerAccountBalancePropagationService> =
  {
    propagate: jest.fn(),
  };

export default mockLedgerAccountBalancePropagationService;
