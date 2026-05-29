import { ELedgerAccountBalanceEffect } from '../../bookkeeping/types/ledger-account-balance.types';
import journalLineEntity from '../../journal-entry/entities/journal-line.entity';
import { UJournalSide } from '../../journal-entry/types/journal-line.types';
import ledgerAccountEntityHelpers from '../../ledger/entities/shared/helpers/ledger-account.entity.helpers';
import ledgerAccountEntity from '../../ledger/entities/shared/ledger-account.entity';
import { ILedgerAccount } from '../../ledger/types/ledger.types';

/**
 * Determines the balance effect of a journal entry based on its account and side.
 * @param account
 * @param journalSide
 * @returns
 */
function getBalanceEffect(
  account: Pick<ILedgerAccount, 'type' | 'normalBalance'>,
  journalSide: UJournalSide
) {
  ledgerAccountEntityHelpers.validateType(account.type);
  ledgerAccountEntity.validateNormalBalance(account.normalBalance);
  journalLineEntity.validateSide(journalSide);

  return journalSide === account.normalBalance
    ? ELedgerAccountBalanceEffect.Increase
    : ELedgerAccountBalanceEffect.Decrease;
}

const journalEntryRules = Object.freeze({
  getBalanceEffect,
});

export default journalEntryRules;
