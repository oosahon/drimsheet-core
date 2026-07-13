import ILedgerBalanceAdjustmentQueue from '../ledger-balance-adjustment-queue.contract';

const mockLedgerAccountBalanceAdjustmentQueue: jest.Mocked<ILedgerBalanceAdjustmentQueue> =
  {
    add: jest.fn(),
  };

export default mockLedgerAccountBalanceAdjustmentQueue;
