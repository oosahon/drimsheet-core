import { TEntityId } from '../../../../shared/types/uuid';
import { AppError } from '../../../../shared/utils/error';
import { IJournalLine } from '../../../journal-entry/types/journal-line.types';

function validateAccountId(accountId: TEntityId, journalLines: IJournalLine[]) {
  const isTheSame = journalLines.every((line) => line.accountId === accountId);

  if (!isTheSame) {
    throw new AppError('All lines must be associated with the same account', {
      cause: journalLines.map((v) => ({ accountId: v.accountId, id: v.id })),
    });
  }
}

const ledgerAccountBalanceAdjustmentEntityHelpers = Object.freeze({
  validateAccountId,
});

export default ledgerAccountBalanceAdjustmentEntityHelpers;
