import { IMoney } from '../../../../shared/types/money.types';
import { TEntityId } from '../../../../shared/types/uuid';
import stringUtils from '../../../../shared/utils/string';
import moneyValue from '../../../../shared/value-objects/money.vo';
import journalEntryError from '../../errors/journal-entry.error';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
  UJournalEntrySourceType,
  UJournalEntryStatus,
} from '../../types/journal-entry.types';
import { EJournalSide, IJournalLine } from '../../types/journal-line.types';

function validateStatus(status: UJournalEntryStatus) {
  if (!Object.values(EJournalEntryStatus).includes(status)) {
    throw new journalEntryError.InvalidStatus({ status });
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
      lines,
    });
  }

  if (!isUniqueSequenceOrder(lines)) {
    throw new journalEntryError.DuplicateSequenceOrders({ lines });
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
    journalEntryError.InvalidValue
  );
}

function validateSourceType(sourceType: UJournalEntrySourceType) {
  if (!Object.values(EJournalEntrySourceType).includes(sourceType)) {
    throw new journalEntryError.InvalidSourceType({ sourceType });
  }
}

function validateCounterpartyId(
  sourceType: UJournalEntrySourceType,
  counterPartyId: TEntityId | null
) {
  if (sourceType === EJournalEntrySourceType.Transfer && counterPartyId) {
    throw new journalEntryError.CounterpartyIdNotAllowed();
  }
  if (counterPartyId) {
    stringUtils.validateUUID(counterPartyId, journalEntryError.InvalidValue);
  }
}

const journalEntryEntityHelpers = Object.freeze({
  validateStatus,
  validateLine,
  isUniqueSequenceOrder,
  getMemo,
  validateSourceType,
  validateCounterpartyId,
});

export default journalEntryEntityHelpers;
