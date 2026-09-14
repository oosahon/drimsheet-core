import journalLineValidation from '@domain/journal-entry/entities/validations/journal-line.validation';
import { UJournalSide } from '@domain/journal-entry/types/journal-line.types';
import ledgerAccountValidation from '@domain/ledger/entities/validations/ledger-account.validation';
import { ELedgerAccountBalanceEffect } from '@domain/ledger/types/ledger-account-balance.types';
import { ILedgerAccount } from '@domain/ledger/types/ledger.types';

export default function ledgerBalanceEffectRule(
  account: Pick<ILedgerAccount, 'type' | 'normalBalance'>,
  journalSide: UJournalSide
) {
  ledgerAccountValidation.validateType(account.type);
  ledgerAccountValidation.validateNormalBalance(account.normalBalance);
  journalLineValidation.validateSide(journalSide);

  return journalSide === account.normalBalance
    ? ELedgerAccountBalanceEffect.Increase
    : ELedgerAccountBalanceEffect.Decrease;
}
