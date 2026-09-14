import { TEntityId } from '@shared/types/uuid';

import getJournalEntryMemo from '@domain/journal-entry/entities/helpers/get-memo.helper';
import journalEntryEntity from '@domain/journal-entry/entities/journal-entry.entity';
import journalEntryValidation from '@domain/journal-entry/entities/validations/journal-entry.validation';
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
  UJournalSide,
} from '@domain/journal-entry/types/journal-line.types';
import { SYSTEM_CURRENCIES } from '@domain/money/config/currencies.config';
import moneyValue from '@domain/money/values/money.vo';

describe('journalEntryValidation', () => {
  it('is frozen', () => {
    expect(Object.isFrozen(journalEntryValidation)).toBe(true);
    expect(journalEntryEntity.validateStatus).toBe(
      journalEntryValidation.validateStatus
    );
  });

  describe('validateStatus', () => {
    it('should not throw for valid statuses', () => {
      expect(() =>
        journalEntryValidation.validateStatus(EJournalEntryStatus.Draft)
      ).not.toThrow();
      expect(() =>
        journalEntryValidation.validateStatus(EJournalEntryStatus.Posted)
      ).not.toThrow();
      expect(() =>
        journalEntryValidation.validateStatus(EJournalEntryStatus.Voided)
      ).not.toThrow();
      expect(() =>
        journalEntryValidation.validateStatus(EJournalEntryStatus.Archived)
      ).not.toThrow();
    });

    it('should throw InvalidStatus for an invalid status', () => {
      expect(() =>
        journalEntryValidation.validateStatus(
          'invalid_status' as UJournalEntryStatus
        )
      ).toThrow(journalEntryError.InvalidStatus);
    });
  });

  describe('validateTransition', () => {
    it('should not throw if currentStatus is in allowedStatuses', () => {
      expect(() =>
        journalEntryValidation.validateTransition(
          EJournalEntryStatus.Posted,
          EJournalEntryStatus.Voided,
          [EJournalEntryStatus.Posted]
        )
      ).not.toThrow();
    });

    it('should throw InvalidStatusTransition if currentStatus is not in allowedStatuses', () => {
      expect(() =>
        journalEntryValidation.validateTransition(
          EJournalEntryStatus.Draft,
          EJournalEntryStatus.Voided,
          [EJournalEntryStatus.Posted]
        )
      ).toThrow(journalEntryError.InvalidStatusTransition);
    });
  });

  describe('isUniqueSequenceOrder', () => {
    it('should return true for unique sequence orders', () => {
      const lines = [
        { sequenceOrder: 1 } as IJournalLine,
        { sequenceOrder: 2 } as IJournalLine,
      ];
      expect(journalEntryValidation.isUniqueSequenceOrder(lines)).toBe(true);
    });

    it('should return false for duplicate sequence orders', () => {
      const lines = [
        { sequenceOrder: 1 } as IJournalLine,
        { sequenceOrder: 1 } as IJournalLine,
      ];
      expect(journalEntryValidation.isUniqueSequenceOrder(lines)).toBe(false);
    });
  });

  describe('validateLine', () => {
    const validDebitLine: IJournalLine = {
      id: 'l1' as TEntityId,
      entryId: 'e1' as TEntityId,
      accountId: 'a1' as TEntityId,
      counterpartyId: null,
      sequenceOrder: 1,
      amount: moneyValue.make(100, SYSTEM_CURRENCIES.USD, false),
      exchangeRate: null,
      functionalAmount: moneyValue.make(100, SYSTEM_CURRENCIES.USD, false),
      side: EJournalSide.Debit,
      description: 'debit line',
      meta: null,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const validCreditLine: IJournalLine = {
      ...validDebitLine,
      id: 'l2' as TEntityId,
      sequenceOrder: 2,
      side: EJournalSide.Credit,
    };

    it('should not throw for a valid balanced set of lines', () => {
      expect(() =>
        journalEntryValidation.validateLine([validDebitLine, validCreditLine])
      ).not.toThrow();
    });

    it('should not throw for balanced zero-value lines', () => {
      const zeroAmount = moneyValue.makeZeroAmount(SYSTEM_CURRENCIES.USD);

      expect(() =>
        journalEntryValidation.validateLine([
          {
            ...validDebitLine,
            amount: zeroAmount,
            functionalAmount: zeroAmount,
          },
          {
            ...validCreditLine,
            amount: zeroAmount,
            functionalAmount: zeroAmount,
          },
        ])
      ).not.toThrow();
    });

    it('should reject balanced negative line amounts', () => {
      const negativeAmount = moneyValue.make(
        -100,
        SYSTEM_CURRENCIES.USD,
        false
      );

      expect(() =>
        journalEntryValidation.validateLine([
          {
            ...validDebitLine,
            amount: negativeAmount,
            functionalAmount: negativeAmount,
          },
          {
            ...validCreditLine,
            amount: negativeAmount,
            functionalAmount: negativeAmount,
          },
        ])
      ).toThrow(journalEntryError.InvalidJournalLineItem);
    });

    it('should throw InvalidLineItems if line length is less than 2', () => {
      expect(() => journalEntryValidation.validateLine([])).toThrow(
        journalEntryError.InvalidLineItems
      );
      expect(() =>
        journalEntryValidation.validateLine([validDebitLine])
      ).toThrow(journalEntryError.InvalidLineItems);
    });

    it('should throw InvalidJournalLineItem for invalid line side', () => {
      const invalidSideLine = {
        ...validDebitLine,
        side: 'invalid' as UJournalSide,
      };
      expect(() =>
        journalEntryValidation.validateLine([invalidSideLine, validCreditLine])
      ).toThrow(journalEntryError.InvalidJournalLineItem);
    });

    it('should throw InvalidLineItems if there are no debits or no credits', () => {
      const doubleDebit = [
        validDebitLine,
        { ...validDebitLine, sequenceOrder: 2 },
      ];
      expect(() => journalEntryValidation.validateLine(doubleDebit)).toThrow(
        journalEntryError.InvalidLineItems
      );
    });

    it('should throw UnbalancedJournalEntry if debits and credits do not balance', () => {
      const unbalancedCredit = {
        ...validCreditLine,
        amount: moneyValue.make(200, SYSTEM_CURRENCIES.USD, false),
        functionalAmount: moneyValue.make(200, SYSTEM_CURRENCIES.USD, false),
      };
      expect(() =>
        journalEntryValidation.validateLine([validDebitLine, unbalancedCredit])
      ).toThrow(journalEntryError.UnbalancedJournalEntry);
    });

    it('should throw DuplicateSequenceOrders if sequence orders are not unique', () => {
      const duplicateSequence = [
        validDebitLine,
        { ...validCreditLine, sequenceOrder: 1 },
      ];
      expect(() =>
        journalEntryValidation.validateLine(duplicateSequence)
      ).toThrow(journalEntryError.DuplicateSequenceOrders);
    });
  });

  describe('getJournalEntryMemo', () => {
    it('should return null for null/empty string', () => {
      expect(getJournalEntryMemo(null)).toBeNull();
      expect(getJournalEntryMemo('')).toBeNull();
    });

    it('should return sanitized/trimmed string for a valid memo', () => {
      expect(getJournalEntryMemo('   A valid memo   ')).toBe('A valid memo');
    });

    it('should throw InvalidMemo for an overly long string', () => {
      expect(() => getJournalEntryMemo('a'.repeat(251))).toThrow(
        journalEntryError.InvalidMemo
      );
    });
  });

  describe('validateSourceType', () => {
    it('should not throw for valid source types', () => {
      expect(() =>
        journalEntryValidation.validateSourceType(
          EJournalEntrySourceType.Receipt
        )
      ).not.toThrow();
    });

    it('should throw InvalidSourceType for invalid source type', () => {
      expect(() =>
        journalEntryValidation.validateSourceType(
          'invalid_source' as UJournalEntrySourceType
        )
      ).toThrow(journalEntryError.InvalidSourceType);
    });
  });

  describe('validateCounterparties', () => {
    it('should reject a counterparty on a transfer credit line', () => {
      const sourceLineWithCounterparty = {
        counterpartyId: 'cp1' as TEntityId,
        side: EJournalSide.Credit,
      } as IJournalLine;

      expect(() =>
        journalEntryValidation.validateCounterparties(
          EJournalEntrySourceType.Transfer,
          [sourceLineWithCounterparty]
        )
      ).toThrow(journalEntryError.CounterpartyIdNotAllowed);
    });

    it('should allow a counterparty on a transfer debit line', () => {
      const destinationLineWithCounterparty = {
        counterpartyId: 'cp1' as TEntityId,
        side: EJournalSide.Debit,
      } as IJournalLine;

      expect(() =>
        journalEntryValidation.validateCounterparties(
          EJournalEntrySourceType.Transfer,
          [destinationLineWithCounterparty]
        )
      ).not.toThrow();
    });

    it('should allow counterparties on non-transfer lines', () => {
      const sourceLineWithCounterparty = {
        counterpartyId: 'cp1' as TEntityId,
        side: EJournalSide.Credit,
      } as IJournalLine;

      expect(() =>
        journalEntryValidation.validateCounterparties(
          EJournalEntrySourceType.Receipt,
          [sourceLineWithCounterparty]
        )
      ).not.toThrow();
    });
  });

  describe('validatePostedAt', () => {
    it('should not throw for null', () => {
      expect(() => journalEntryValidation.validatePostedAt(null)).not.toThrow();
    });

    it('should not throw for a valid Date', () => {
      expect(() =>
        journalEntryValidation.validatePostedAt(new Date())
      ).not.toThrow();
    });

    it('should throw InvalidPostingDate for an invalid Date', () => {
      expect(() =>
        journalEntryValidation.validatePostedAt(new Date('invalid-date'))
      ).toThrow(journalEntryError.InvalidPostingDate);
    });
  });

  describe('validateVoidedAt', () => {
    it('should not throw for null', () => {
      expect(() => journalEntryValidation.validateVoidedAt(null)).not.toThrow();
    });

    it('should not throw for a valid Date', () => {
      expect(() =>
        journalEntryValidation.validateVoidedAt(new Date())
      ).not.toThrow();
    });

    it('should throw InvalidVoidedAt for an invalid Date', () => {
      expect(() =>
        journalEntryValidation.validateVoidedAt(new Date('invalid-date'))
      ).toThrow(journalEntryError.InvalidVoidedAt);
    });
  });

  describe('validateVoidingEntryId', () => {
    it('should not throw for null', () => {
      expect(() =>
        journalEntryValidation.validateVoidingEntryId(null)
      ).not.toThrow();
    });

    it('should not throw for a valid UUID', () => {
      expect(() =>
        journalEntryValidation.validateVoidingEntryId(
          '4c6e83ef-2a1b-4c3d-8d9e-5e6f7a8b9c0d' as TEntityId
        )
      ).not.toThrow();
    });

    it('should throw InvalidValue for an invalid UUID format', () => {
      expect(() =>
        journalEntryValidation.validateVoidingEntryId(
          'invalid-uuid' as TEntityId
        )
      ).toThrow(journalEntryError.InvalidValue);
    });
  });
});
