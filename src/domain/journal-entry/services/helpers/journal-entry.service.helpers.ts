import dateUtils from '../../../../shared/utils/date';
import journalEntryError from '../../errors/journal-entry.error';
import journalEntryRuleValidator from '../../rules/entry-rule.validator';
import receiptEntryRule from '../../rules/receipt-entry.rule';
import { ICreateReceiptEntryPayload } from '../../types/journal-entry.service.types';

async function validateAccounts(payload: ICreateReceiptEntryPayload) {
  const { header, sourceLine, destinationLines } = payload;

  // const allAccounts = sourceLines
  //   .map((sl) => sl.account)
  //   .concat(destinationLines.map((dl) => dl.account));

  const allAccounts = destinationLines
    .map((v) => v.account)
    .concat(sourceLine.account);

  // Assert that all sources are permitted
  const isValidSource = journalEntryRuleValidator(
    sourceLine.account,
    receiptEntryRule.source
  );

  if (!isValidSource) {
    throw new journalEntryError.InvalidSourceType({
      account: sourceLine.account,
    });
  }

  // Assert that all destinations are permitted
  const invalidDestinations = destinationLines
    .map((v) => v.account)
    .filter(
      (acc) => !journalEntryRuleValidator(acc, receiptEntryRule.destination)
    );
  if (invalidDestinations.length > 0) {
    throw new journalEntryError.InvalidDestinationAccount({
      invalidDestinations,
    });
  }

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
  validateCounterparties,
});

export default journalEntryServiceHelpers;
