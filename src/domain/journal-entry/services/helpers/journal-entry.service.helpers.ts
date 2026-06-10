import { ELedgerAccountSubType } from '../../../ledger/types/ledger-aggregate.types';
import { ILedgerAccount } from '../../../ledger/types/ledger.types';
import journalEntryError from '../../errors/journal-entry.error';
import {
  EJournalEntrySourceType,
  UJournalEntrySourceType,
} from '../../types/journal-entry.types';

function validateTransfer(
  source: ILedgerAccount,
  destinations: ILedgerAccount[]
) {
  const allowedTransferSubTypes: string[] = [
    ELedgerAccountSubType.CashAndCashEquivalent,
  ];

  if (!allowedTransferSubTypes.includes(source.subType)) {
    throw new journalEntryError.TransferNotPermittedOnAccount({
      cause: { accountId: source.id, subType: source.subType },
    });
  }

  const differentSubTypes = destinations
    .filter((account) => account.subType !== source.subType)
    .map((account) => ({ id: account.id, subType: account.subType }));

  if (differentSubTypes.length > 0) {
    throw new journalEntryError.TransferNotPermittedOnAccount({
      cause: differentSubTypes,
    });
  }
}

function validateTransactionAccounts(
  sourceAccount: ILedgerAccount,
  destinationAccounts: ILedgerAccount[],
  sourceType: UJournalEntrySourceType
) {
  switch (sourceType) {
    case EJournalEntrySourceType.Transfer:
      return validateTransfer(sourceAccount, destinationAccounts);
    default:
      throw new journalEntryError.InvalidSourceType({ sourceType });
  }
}

const journalEntryServiceHelpers = Object.freeze({
  validateTransfer,
  validateTransactionAccounts,
});

export default journalEntryServiceHelpers;
