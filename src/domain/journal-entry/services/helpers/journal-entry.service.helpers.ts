import dateUtils from '@shared/utils/date';

import journalEntryError from '@domain/journal-entry/errors/journal-entry.error';
import journalEntryRuleValidator from '@domain/journal-entry/rules/entry-rule.validator';
import { IJournalEntryRule } from '@domain/journal-entry/types/entry.rules.types';
import {
  IJournalEntryBaseLinePayload,
  IJournalEntryHeaderPayload,
  IJournalEntryLinePayload,
} from '@domain/journal-entry/types/journal-entry.service.types';
import { ILedgerAccount } from '@domain/ledger/types/ledger.types';

function validateAccountsAgainstRule(
  sourceAccounts: ILedgerAccount[],
  destinationAccounts: ILedgerAccount[],
  rule: IJournalEntryRule
) {
  const invalidSource = sourceAccounts.find(
    (account) => !journalEntryRuleValidator(account, rule.source)
  );

  if (invalidSource) {
    throw new journalEntryError.InvalidSourceType({
      account: invalidSource,
    });
  }

  const invalidDestinations = destinationAccounts.filter(
    (account) => !journalEntryRuleValidator(account, rule.destination)
  );

  if (invalidDestinations.length > 0) {
    throw new journalEntryError.InvalidDestinationAccount({
      invalidDestinations,
    });
  }
}

function validateAccounts(
  header: Pick<
    IJournalEntryHeaderPayload,
    'accountingEntityId' | 'effectiveDate'
  >,
  journalLines: Pick<IJournalEntryBaseLinePayload, 'account' | 'amount'>[]
) {
  const allAccounts = journalLines.map((line) => line.account);

  // Assert that all accounts belong to the same accounting entity
  const wrongAccountingEntities = allAccounts.filter(
    (acc) => acc.accountingEntityId !== header.accountingEntityId
  );
  if (wrongAccountingEntities.length) {
    throw new journalEntryError.InvalidAccountingEntity({
      accounts: wrongAccountingEntities,
    });
  }

  // Assert that no account is a posting account
  const controlAccounts = allAccounts.filter((acc) => acc.isControlAccount);
  if (controlAccounts.length > 0) {
    throw new journalEntryError.ControlAccountNotAllowed({
      accounts: controlAccounts.map((v) => v.id),
    });
  }

  // Assert that effective date is not before any account's opening date
  const erringEffectiveDates = allAccounts.filter(
    (acc) =>
      acc.openingBalanceDate !== null &&
      dateUtils.isLessThan(header.effectiveDate, acc.openingBalanceDate)
  );

  if (erringEffectiveDates.length) {
    throw new journalEntryError.EffectiveDateIsBeforeOpeningDate({
      accounts: erringEffectiveDates.map((v) => v.id),
      effectiveDate: header.effectiveDate,
    });
  }

  // Assert that line currencies match their fixed-currency accounts
  const mismatchedJournalLines = [];

  for (const journalLine of journalLines) {
    const accountCurrencyCode = journalLine.account.currency?.code ?? null;
    const amountCurrencyCode = journalLine.amount.currency.code;

    const isValidCurrency =
      accountCurrencyCode === null ||
      accountCurrencyCode === amountCurrencyCode;

    if (isValidCurrency) continue;

    mismatchedJournalLines.push({
      accountId: journalLine.account.id,
      accountCurrencyCode,
      amountCurrencyCode,
    });
  }

  if (mismatchedJournalLines.length) {
    throw new journalEntryError.JournalLineAccountCurrencyMismatch({
      lines: mismatchedJournalLines,
    });
  }
}

function validateCounterparties(
  header: IJournalEntryHeaderPayload,
  journalLines: IJournalEntryLinePayload[]
) {
  const allCounterparties = new Set(
    journalLines.flatMap((line) =>
      line.counterparty ? [line.counterparty] : []
    )
  );

  const invalidCounterparties = Array.from(allCounterparties).filter(
    (cp) => cp.accountingEntityId !== header.accountingEntityId
  );

  if (invalidCounterparties.length) {
    throw new journalEntryError.InvalidCounterpartyId({
      invalidCounterparties,
    });
  }
}

const journalEntryServiceHelpers = Object.freeze({
  validateAccounts,
  validateAccountsAgainstRule,
  validateCounterparties,
});

export default journalEntryServiceHelpers;
