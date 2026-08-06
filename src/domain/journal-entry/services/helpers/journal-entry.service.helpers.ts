import dateUtils from '../../../../shared/utils/date';
import { ILedgerAccount } from '../../../ledger/shared/types/ledger.types';
import journalEntryError from '../../errors/journal-entry.error';
import journalEntryRuleValidator from '../../rules/entry-rule.validator';
import receiptEntryRule from '../../rules/receipt-entry.rule';
import { IJournalEntryRule } from '../../types/entry.rules.types';
import { ICreateReceiptEntryPayload } from '../../types/journal-entry.service.types';

function validateAccountsAgainstRule(
  sourceAccount: ILedgerAccount,
  destinationAccounts: ILedgerAccount[],
  rule: IJournalEntryRule
) {
  const isValidSource = journalEntryRuleValidator(sourceAccount, rule.source);

  if (!isValidSource) {
    throw new journalEntryError.InvalidSourceType({
      account: sourceAccount,
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

async function validateAccounts(payload: ICreateReceiptEntryPayload) {
  const { header, sourceLine, destinationLines } = payload;

  const allAccounts = destinationLines
    .map((v) => v.account)
    .concat(sourceLine.account);

  validateAccountsAgainstRule(
    sourceLine.account,
    destinationLines.map((line) => line.account),
    receiptEntryRule
  );

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
      acc.openingBalanceDate === null ||
      dateUtils.isLessThan(header.effectiveDate, acc.openingBalanceDate)
  );

  if (erringEffectiveDates.length) {
    throw new journalEntryError.EffectiveDateIsBeforeOpeningDate({
      accounts: erringEffectiveDates.map((v) => v.id),
      effectiveDate: header.effectiveDate,
    });
  }
}

async function validateCounterparties(payload: ICreateReceiptEntryPayload) {
  const { header, sourceLine, destinationLines } = payload;

  const allCounterparties = new Set(
    [sourceLine, ...destinationLines].flatMap((line) =>
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
