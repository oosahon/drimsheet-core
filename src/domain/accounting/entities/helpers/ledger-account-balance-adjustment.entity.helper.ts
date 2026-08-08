import { TEntityId } from '@shared/types/uuid';

import ledgerAccountBalanceAdjustmentError from '@domain/accounting/errors/ledger-account-balance-adjustment.error';
import { IJournalLine } from '@domain/journal-entry/types/journal-line.types';

function validateAccountId(accountId: TEntityId, journalLines: IJournalLine[]) {
  const isTheSame = journalLines.every((line) => line.accountId === accountId);

  if (!isTheSame) {
    throw new ledgerAccountBalanceAdjustmentError.MixedAccountIds({
      lines: journalLines.map((v) => ({ accountId: v.accountId, id: v.id })),
    });
  }
}

const ledgerAccountBalanceAdjustmentEntityHelpers = Object.freeze({
  validateAccountId,
});

export default ledgerAccountBalanceAdjustmentEntityHelpers;
