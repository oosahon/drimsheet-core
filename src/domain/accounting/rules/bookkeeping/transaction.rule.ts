import journalEntryError from '../../../journal-entry/errors/journal-entry.error';
import {
  EJournalEntrySourceType,
  UJournalEntrySourceType,
} from '../../../journal-entry/types/journal-entry.types';
import { ILedgerAccount } from '../../../ledger/types/ledger.types';
import paymentTransactionRule from './payment-transaction.rule';
import transferTransactionRule from './transfer-transaction.rule';

export default function enforceTransactionAccountsRule(
  sourceAccount: ILedgerAccount,
  destinationAccounts: ILedgerAccount[],
  sourceType: UJournalEntrySourceType
) {
  switch (sourceType) {
    case EJournalEntrySourceType.Transfer:
      return transferTransactionRule.enforce(
        sourceAccount,
        destinationAccounts
      );

    case EJournalEntrySourceType.Payment:
      return paymentTransactionRule.enforce(sourceAccount, destinationAccounts);
    default:
      throw new journalEntryError.InvalidSourceType({ sourceType });
  }
}
