import {
  ELedgerAccountBalanceEffect,
  ULedgerAccountBalanceEffect,
} from '../../bookkeeping/types/ledger-account-balance.types';
import journalLineEntity from '../../journal-entry/entities/journal-line.entity';
import {
  EJournalSide,
  UJournalSide,
} from '../../journal-entry/types/journal-line.types';
import ledgerAccountEntityHelpers from '../../ledger/entities/shared/helpers/ledger-account.entity.helpers';
import ledgerAccountEntity from '../../ledger/entities/shared/ledger-account.entity';
import {
  ENormalBalance,
  ULedgerType,
  UNormalBalance,
} from '../../ledger/types/ledger.types';

export interface IGetBalanceEffectPayload {
  accountType: ULedgerType;
  journalSide: UJournalSide;
  normalBalance: UNormalBalance;
}

function getBalanceEffect(
  payload: IGetBalanceEffectPayload
): ULedgerAccountBalanceEffect {
  const { accountType, normalBalance, journalSide } = payload;

  ledgerAccountEntityHelpers.validateType(accountType);
  ledgerAccountEntity.validateNormalBalance(normalBalance);
  journalLineEntity.validateSide(journalSide);

  return journalSide === normalBalance
    ? ELedgerAccountBalanceEffect.Increase
    : ELedgerAccountBalanceEffect.Decrease;
}

export interface IGetOpeningBalanceSidesPayload {
  normalBalance: UNormalBalance;
}

export interface IGetOpeningBalanceSidesResult {
  targetAccountSide: UJournalSide;
  equityAccountSide: UJournalSide;
}

function getOpeningBalanceSides(
  payload: IGetOpeningBalanceSidesPayload
): IGetOpeningBalanceSidesResult {
  const { normalBalance } = payload;

  ledgerAccountEntity.validateNormalBalance(normalBalance);

  const targetAccountSide =
    normalBalance === ENormalBalance.Debit
      ? EJournalSide.Debit
      : EJournalSide.Credit;

  const equityAccountSide =
    targetAccountSide === EJournalSide.Debit
      ? EJournalSide.Credit
      : EJournalSide.Debit;

  return {
    targetAccountSide,
    equityAccountSide,
  };
}

const journalEntryRules = Object.freeze({
  getBalanceEffect,
  getOpeningBalanceSides,
});

export default journalEntryRules;
