import journalLineEntity from '../../../journal-entry/entities/journal-line.entity';
import { UJournalSide } from '../../../journal-entry/types/journal-line.types';
import ledgerAccountEntityHelpers from '../../../ledger/entities/shared/helpers/ledger-account.entity.helpers';
import ledgerAccountEntity from '../../../ledger/entities/shared/ledger-account.entity';
import { ELedgerAccountBalanceEffect } from '../../../ledger/types/ledger-account-balance.types';
import { ILedgerAccount } from '../../../ledger/types/ledger.types';

function deriver(
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

const balanceEffectRule = Object.freeze({
  derive: deriver,
});

export default balanceEffectRule;
