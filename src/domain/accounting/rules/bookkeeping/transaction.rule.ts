import journalEntryError from '../../../journal-entry/errors/journal-entry.error';
import {
  EJournalEntrySourceType,
  UJournalEntrySourceType,
} from '../../../journal-entry/types/journal-entry.types';
import { ITransactionRule } from '../../types/bookkeeping-rule.types';
import paymentTransactionRule from './payment-transaction.rule';
import transferTransactionRule from './transfer-transaction.rule';

export default function getTransactionRule(
  sourceType: UJournalEntrySourceType
): ITransactionRule {
  switch (sourceType) {
    case EJournalEntrySourceType.Transfer:
      return transferTransactionRule;

    case EJournalEntrySourceType.Payment:
      return paymentTransactionRule;
    default:
      throw new journalEntryError.InvalidSourceType({ sourceType });
  }
}
