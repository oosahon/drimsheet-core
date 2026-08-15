import { TEntityId } from '@shared/types/uuid';

import { ILedgerAccountBalanceAdjustmentDto } from '@app/ledger/dtos/ledger-account-balance-adjustment/ledger-account-balance-adjustment.dto';
import makeLedgerAccountBalanceAdjustmentWorker from '@app/ledger/workers/ledger-account-balance-adjustment.worker';

describe('makeLedgerAccountBalanceAdjustmentWorker', () => {
  const payload: ILedgerAccountBalanceAdjustmentDto = {
    correlationId: 'correlation-id',
    journalEntry: {
      id: 'journal-entry-id' as TEntityId,
      createdBy: 'user-id' as TEntityId,
    },
    accountingEntityId: 'accounting-entity-id' as TEntityId,
    balanceDelta: {
      amount: 1000,
      currencyCode: 'NGN',
      isMinorUnit: true,
    },
    functionalBalanceDelta: {
      amount: 1000,
      currencyCode: 'NGN',
      isMinorUnit: true,
    },
    ledgerAccountId: 'ledger-account-id' as TEntityId,
  };

  it('adjusts the ledger account balance', async () => {
    const usecase = jest.fn().mockResolvedValue(undefined);
    const worker = makeLedgerAccountBalanceAdjustmentWorker({
      usecase,
    });

    await worker(payload);

    expect(usecase).toHaveBeenCalledWith(payload);
  });

  it('propagates adjustment failures', async () => {
    const adjustmentError = new Error('adjustment failed');
    const usecase = jest.fn().mockRejectedValue(adjustmentError);
    const worker = makeLedgerAccountBalanceAdjustmentWorker({
      usecase,
    });

    await expect(worker(payload)).rejects.toBe(adjustmentError);
  });
});
