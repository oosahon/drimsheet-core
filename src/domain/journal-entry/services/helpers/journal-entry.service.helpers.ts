import dateUtils from '../../../../shared/utils/date';
import journalEntryError from '../../errors/journal-entry.error';
import journalEntryRuleValidator from '../../rules/entry-rule.validator';
import receiptEntryRule from '../../rules/receipt-entry.rule';
import { ICreateReceiptEntryPayload } from '../../types/journal-entry.service.types';

async function validateAccounts(payload: ICreateReceiptEntryPayload) {
  const { header, sourceLines, destinationLines } = payload;

  const allAccounts = sourceLines
    .map((sl) => sl.account)
    .concat(destinationLines.map((dl) => dl.account));

  // Assert that all sources are permitted
  const invalidSources = sourceLines
    .map((v) => v.account)
    .filter((acc) => !journalEntryRuleValidator(acc, receiptEntryRule.source));
  if (invalidSources.length > 0) {
    throw new journalEntryError.InvalidSourceType({ invalidSources });
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
      dateUtils.isLessThan(acc.openingBalanceDate, header.effectiveDate)
  );

  if (erringEffectiveDates.length) {
    throw new journalEntryError.EffectiveDateIsBeforeOpeningDate({
      accounts: erringEffectiveDates.map((v) => v.id),
      effectiveDate: header.effectiveDate,
    });
  }
}

const journalEntryServiceHelpers = Object.freeze({ validateAccounts });

export default journalEntryServiceHelpers;
