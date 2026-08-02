import journalLineEntity from '../../journal-entry/entities/journal-line.entity';
import { UJournalSide } from '../../journal-entry/types/journal-line.types';
import { ELedgerAccountBalanceEffect } from '../../ledger/account-balance/types/ledger-account-balance.types';
import ledgerAccountEntityHelpers from '../../ledger/shared/entities/helpers/ledger-account.entity.helpers';
import ledgerAccountEntity from '../../ledger/shared/entities/ledger-account.entity';
import { ILedgerAccount } from '../../ledger/shared/types/ledger.types';

export default function ledgerBalanceEffectRule(
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
