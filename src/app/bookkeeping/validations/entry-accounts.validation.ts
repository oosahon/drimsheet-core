import journalEntryError from '../../../domain/journal-entry/errors/journal-entry.error';
import {
  EJournalEntrySourceType,
  UJournalEntrySourceType,
} from '../../../domain/journal-entry/types/journal-entry.types';
import { ILedgerAccount } from '../../../domain/ledger/types/ledger.types';
import validateTransferEntryAccounts from './transfer-entry-accounts.validation';

export default function validateJournalEntryTransactionAccounts(
  sourceAccount: ILedgerAccount,
  destinationAccounts: ILedgerAccount[],
  sourceType: UJournalEntrySourceType
) {
  switch (sourceType) {
    case EJournalEntrySourceType.Transfer:
      return validateTransferEntryAccounts(sourceAccount, destinationAccounts);
    default:
      throw new journalEntryError.InvalidSourceType({ sourceType });
  }
}
