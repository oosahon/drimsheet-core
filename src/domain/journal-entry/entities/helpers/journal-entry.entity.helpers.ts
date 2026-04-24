import { IMoney } from '../../../../shared/types/money.types';
import { AppError } from '../../../../shared/value-objects/error';
import moneyValue from '../../../../shared/value-objects/money.vo';
import {
  EJournalEntryStatus,
  UJournalEntryStatus,
} from '../../types/journal-entry.types';
import { EJournalSide, IJournalLine } from '../../types/journal-line.types';

function validateStatus(status: UJournalEntryStatus) {
  if (!Object.values(EJournalEntryStatus).includes(status)) {
    throw new AppError('Invalid status', { cause: status });
  }
}

function isUniqueSequenceOrder(lineItems: IJournalLine[]) {
  const sequenceOrders = lineItems.map((item) => item.sequenceOrder);
  const uniqueSequenceOrders = new Set(sequenceOrders);

  return sequenceOrders.length === uniqueSequenceOrders.size;
}

function validateLineItems(lineItems: IJournalLine[]) {
  if (!lineItems.length || lineItems.length < 2) {
    throw new AppError('Invalid line items', { cause: lineItems });
  }

  const debits: IMoney[] = [];
  const credits: IMoney[] = [];

  for (const item of lineItems) {
    if (item.side === EJournalSide.Debit) {
      debits.push(item.functionalAmount);
    } else if (item.side === EJournalSide.Credit) {
      credits.push(item.functionalAmount);
    } else {
      throw new AppError('Invalid journal line item', { cause: item });
    }
  }

  if (!debits.length || !credits.length) {
    throw new AppError('Invalid line items', { cause: lineItems });
  }

  const totalDebits = moneyValue.add(...debits);
  const totalCredits = moneyValue.add(...credits);

  if (!moneyValue.equals(totalDebits, totalCredits)) {
    throw new AppError('Total debits must equal total credits', {
      cause: lineItems,
    });
  }

  if (!isUniqueSequenceOrder(lineItems)) {
    throw new AppError('Sequence orders must be unique', { cause: lineItems });
  }
}

const journalEntryEntityHelpers = Object.freeze({
  validateStatus,
  validateLineItems,
  isUniqueSequenceOrder,
});

export default journalEntryEntityHelpers;
