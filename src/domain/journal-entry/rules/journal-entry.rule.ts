import ledgerAccountEntityHelpers from '../../ledger/entities/shared/helpers/ledger-account.entity.helpers';
import ledgerAccountEntity from '../../ledger/entities/shared/ledger-account.entity';
import { ELedgerAccountBalanceEffect } from '../../ledger/types/ledger-account-balance.types';
import { ILedgerAccount } from '../../ledger/types/ledger.types';
import journalLineEntity from '../entities/journal-line.entity';
import { UJournalSide } from '../types/journal-line.types';

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
