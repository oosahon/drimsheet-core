import ILedgerBalancePropagationPreparationService from '@app/ledger/contracts/ledger-balance-propagation-preparation.service.contract';

const mockLedgerBalancePropagationPreparationService: jest.Mocked<ILedgerBalancePropagationPreparationService> =
  { prepare: jest.fn() };

export default mockLedgerBalancePropagationPreparationService;
