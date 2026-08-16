import { ILedgerAccountBalanceAdjustmentDto } from '@app/ledger/dtos/ledger-account-balance-adjustment/ledger-account-balance-adjustment.dto';

interface IDependencies {
  usecase: (payload: ILedgerAccountBalanceAdjustmentDto) => Promise<void>;
}

export default function makeLedgerAccountBalanceAdjustmentWorker(
  deps: IDependencies
) {
  return async (payload: ILedgerAccountBalanceAdjustmentDto) => {
    await deps.usecase(payload);
  };
}
