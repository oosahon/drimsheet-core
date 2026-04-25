import journalLineEntity from '../../journal-entry/entities/journal-line.entity';
import { UJournalSide } from '../../journal-entry/types/journal-line.types';
import ledgerAccountEntityHelpers from '../../ledger/entities/shared/helpers/ledger-account.entity.helpers';
import ledgerAccountEntity from '../../ledger/entities/shared/ledger-account.entity';
import { ULedgerType, UNormalBalance } from '../../ledger/types/ledger.types';
import {
  ELedgerAccountBalanceEffect,
  ULedgerAccountBalanceEffect,
} from '../types/ledger-account-balance.types';

interface IPayload {
  accountType: ULedgerType;
  journalSide: UJournalSide;
  normalBalance: UNormalBalance;
}

export default function getBalanceEffectRule(
  payload: IPayload
): ULedgerAccountBalanceEffect {
  const { accountType, normalBalance, journalSide } = payload;

  ledgerAccountEntityHelpers.validateType(accountType);
  ledgerAccountEntity.validateNormalBalance(normalBalance);
  journalLineEntity.validateSide(journalSide);

  return journalSide === normalBalance
    ? ELedgerAccountBalanceEffect.Increase
    : ELedgerAccountBalanceEffect.Decrease;
}
