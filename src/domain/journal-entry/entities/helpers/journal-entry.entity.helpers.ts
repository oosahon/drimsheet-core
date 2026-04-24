import { IMoney } from '../../../../shared/types/money.types';
import stringUtils from '../../../../shared/utils/string';
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

function isUniqueSequenceOrder(lines: IJournalLine[]) {
  const sequenceOrders = lines.map((item) => item.sequenceOrder);
  const uniqueSequenceOrders = new Set(sequenceOrders);

  return sequenceOrders.length === uniqueSequenceOrders.size;
}

function validateLine(lines: IJournalLine[]) {
  if (!lines.length || lines.length < 2) {
    throw new AppError('Invalid line items', { cause: lines });
  }

  const debits: IMoney[] = [];
  const credits: IMoney[] = [];

  for (const item of lines) {
    if (item.side === EJournalSide.Debit) {
      debits.push(item.functionalAmount);
    } else if (item.side === EJournalSide.Credit) {
      credits.push(item.functionalAmount);
    } else {
      throw new AppError('Invalid journal line item', { cause: item });
    }
  }

  if (!debits.length || !credits.length) {
    throw new AppError('Invalid line items', { cause: lines });
  }

  const totalDebits = moneyValue.add(...debits);
  const totalCredits = moneyValue.add(...credits);

  if (!moneyValue.equals(totalDebits, totalCredits)) {
    throw new AppError('Total debits must equal total credits', {
      cause: lines,
    });
  }

  if (!isUniqueSequenceOrder(lines)) {
    throw new AppError('Sequence orders must be unique', { cause: lines });
  }
}

function getMemo(value: string | null) {
  if (!value) return null;

  return stringUtils.sanitizeAndValidate(value, {
    max: 100,
    min: 1,
  });
}

const journalEntryEntityHelpers = Object.freeze({
  validateStatus,
  validateLine,
  isUniqueSequenceOrder,
  getMemo,
});

export default journalEntryEntityHelpers;
