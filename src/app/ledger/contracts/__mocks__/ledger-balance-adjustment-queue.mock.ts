import ILedgerBalanceAdjustmentQueue from '@app/ledger/contracts/ledger-balance-adjustment-queue.contract';

const mockLedgerAccountBalanceAdjustmentQueue: jest.Mocked<ILedgerBalanceAdjustmentQueue> =
  {
    add: jest.fn(),
  };

export default mockLedgerAccountBalanceAdjustmentQueue;
