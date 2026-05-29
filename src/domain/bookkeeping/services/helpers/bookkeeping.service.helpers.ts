import { ELedgerAccountSubType } from '../../../../app/contracts/dto/ledger-account.dto';
import journalEntryError from '../../../journal-entry/errors/journal-entry.error';
import {
  EJournalEntrySourceType,
  UJournalEntrySourceType,
} from '../../../journal-entry/types/journal-entry.types';
import { ILedgerAccount } from '../../../ledger/types/ledger.types';
import bookkeepingError from '../../errors/bookkeeping.error';

function validateTransfer(
  source: ILedgerAccount,
  destinations: ILedgerAccount[]
) {
  const allowedTransferSubTypes: string[] = [
    ELedgerAccountSubType.CashAndCashEquivalent,
  ];

  if (!allowedTransferSubTypes.includes(source.subType)) {
    throw new bookkeepingError.TransferNotPermittedOnAccount({
      cause: { accountId: source.id, subType: source.subType },
    });
  }

  const differentSubTypes = destinations
    .filter((account) => account.subType !== source.subType)
    .map((account) => ({ id: account.id, subType: account.subType }));

  if (differentSubTypes.length > 0) {
    throw new bookkeepingError.TransferNotPermittedOnAccount({
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

const bookkeepingServiceHelpers = Object.freeze({
  validateTransfer,
  validateTransactionAccounts,
});

export default bookkeepingServiceHelpers;
