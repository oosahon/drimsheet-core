import { TEntityId } from '@shared/types/uuid';
import dateUtils from '@shared/utils/date';
import serializeBigIntInObj from '@shared/utils/serialize-bigint-in-object';
import stringUtils from '@shared/utils/string';

import journalEntryError from '@domain/journal-entry/errors/journal-entry.error';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
  UJournalEntrySourceType,
  UJournalEntryStatus,
} from '@domain/journal-entry/types/journal-entry.types';
import {
  EJournalSide,
  IJournalLine,
} from '@domain/journal-entry/types/journal-line.types';
import { IMoney } from '@domain/money/types/money.types';
import moneyValue from '@domain/money/values/money.vo';

function validateStatus(status: UJournalEntryStatus) {
  if (!Object.values(EJournalEntryStatus).includes(status)) {
    throw new journalEntryError.InvalidStatus({ status });
  }
}

function validateTransition(
  currentStatus: UJournalEntryStatus,
  nextStatus: UJournalEntryStatus,
  allowedStatuses: UJournalEntryStatus[]
) {
  if (!allowedStatuses.includes(currentStatus)) {
    throw new journalEntryError.InvalidStatusTransition({
      currentStatus,
      nextStatus,
    });
  }
}

function isUniqueSequenceOrder(lines: IJournalLine[]) {
  const sequenceOrders = lines.map((item) => item.sequenceOrder);
  const uniqueSequenceOrders = new Set(sequenceOrders);

  return sequenceOrders.length === uniqueSequenceOrders.size;
}

function validateLine(lines: IJournalLine[]) {
  if (!lines.length || lines.length < 2) {
    throw new journalEntryError.InvalidLineItems({ lines });
  }

  const debits: IMoney[] = [];
  const credits: IMoney[] = [];

  for (const item of lines) {
    const zeroAmount = moneyValue.makeZeroAmount(item.amount.currency);

    if (moneyValue.isLessThan(item.amount, zeroAmount)) {
      throw new journalEntryError.InvalidJournalLineItem({
        item: serializeBigIntInObj({
          sequenceOrder: item.sequenceOrder,
          side: item.side,
          amount: item.amount,
        }),
      });
    }

    if (item.side === EJournalSide.Debit) {
      debits.push(item.functionalAmount);
    } else if (item.side === EJournalSide.Credit) {
      credits.push(item.functionalAmount);
    } else {
      throw new journalEntryError.InvalidJournalLineItem({ item });
    }
  }

  if (!debits.length || !credits.length) {
    throw new journalEntryError.InvalidLineItems({ lines });
  }

  const totalDebits = moneyValue.add(...debits);
  const totalCredits = moneyValue.add(...credits);

  if (!moneyValue.equals(totalDebits, totalCredits)) {
    throw new journalEntryError.UnbalancedJournalEntry({
      lines: serializeBigIntInObj(lines).map((line) => ({
        amount: line.amount,
        side: line.side,
      })),
    });
  }

  if (!isUniqueSequenceOrder(lines)) {
    throw new journalEntryError.DuplicateSequenceOrders({
      lines: serializeBigIntInObj(lines).map((line) => ({
        amount: line.amount,
        side: line.side,
      })),
    });
  }
}

function getMemo(value: string | null) {
  if (!value) return null;

  return stringUtils.sanitizeAndValidate(
    value,
    {
      max: 250,
      min: 1,
    },
    journalEntryError.InvalidMemo
  );
}

function validateSourceType(sourceType: UJournalEntrySourceType) {
  if (!Object.values(EJournalEntrySourceType).includes(sourceType)) {
    throw new journalEntryError.InvalidSourceType({ sourceType });
  }
}

function validateCounterparties(
  sourceType: UJournalEntrySourceType,
  lines: IJournalLine[]
) {
  const hasCounterparty = lines.some((line) => line.counterpartyId !== null);

  if (sourceType === EJournalEntrySourceType.Transfer && hasCounterparty) {
    throw new journalEntryError.CounterpartyIdNotAllowed();
  }
}

function validatePostedAt(value: Date | null) {
  if (value) {
    dateUtils.validateDate(value, journalEntryError.InvalidPostingDate);
  }
}

function validateVoidedAt(value: Date | null) {
  if (value) {
    dateUtils.validateDate(value, journalEntryError.InvalidVoidedAt);
  }
}

function validateVoidingEntryId(value: TEntityId | null) {
  if (value) {
    stringUtils.validateUUID(value, journalEntryError.InvalidValue);
  }
}

const journalEntryEntityHelpers = Object.freeze({
  validateStatus,
  validateTransition,
  validateLine,
  isUniqueSequenceOrder,
  getMemo,
  validateSourceType,
  validateCounterparties,
  validatePostedAt,
  validateVoidedAt,
  validateVoidingEntryId,
});

export default journalEntryEntityHelpers;
