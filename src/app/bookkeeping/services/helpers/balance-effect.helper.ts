import journalLineEntity from '../../../../domain/journal-entry/entities/journal-line.entity';
import { UJournalSide } from '../../../../domain/journal-entry/types/journal-line.types';
import ledgerAccountEntityHelpers from '../../../../domain/ledger/entities/shared/helpers/ledger-account.entity.helpers';
import ledgerAccountEntity from '../../../../domain/ledger/entities/shared/ledger-account.entity';
import { ELedgerAccountBalanceEffect } from '../../../../domain/ledger/types/ledger-account-balance.types';
import { ILedgerAccount } from '../../../../domain/ledger/types/ledger.types';

export default function getLedgerAccountBalanceEffect(
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
