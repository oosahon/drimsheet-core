import { ILedgerAccountBalanceAdjustmentDto } from '../dtos/ledger-account-balance-adjustment.dto';

export const LEDGER_BALANCE_ADJUSTMENT_QUEUE_NAME =
  'ledger-account-balance-adjustment-queue' as const;

export default interface ILedgerBalanceAdjustmentQueue {
  add(payload: ILedgerAccountBalanceAdjustmentDto): Promise<void>;
}
