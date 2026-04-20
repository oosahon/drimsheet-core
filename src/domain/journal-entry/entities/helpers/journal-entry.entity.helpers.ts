import { IMoney } from '../../../../shared/types/money.types';
import { AppError } from '../../../../shared/value-objects/error';
import moneyValue from '../../../../shared/value-objects/money.vo';
import {
  EEJournalEntrySide,
  EJournalEntryStatus,
  IJournalLineItem,
  UJournalEntryStatus,
} from '../../types/journal-entry.types';

function validateStatus(status: UJournalEntryStatus) {
  if (!Object.values(EJournalEntryStatus).includes(status)) {
    throw new AppError('Invalid status', { cause: status });
  }
}

function validateLineItems(lineItems: IJournalLineItem[]) {
  if (!lineItems.length || lineItems.length < 2) {
    throw new AppError('Invalid line items', { cause: lineItems });
  }

  const debits: IMoney[] = [];
  const credits: IMoney[] = [];

  for (const item of lineItems) {
    if (item.side === EEJournalEntrySide.Debit) {
      debits.push(item.functionalAmount);
    } else if (item.side === EEJournalEntrySide.Credit) {
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
}

const journalEntryEntityHelpers = Object.freeze({
  validateStatus,
  validateLineItems,
});

export default journalEntryEntityHelpers;
