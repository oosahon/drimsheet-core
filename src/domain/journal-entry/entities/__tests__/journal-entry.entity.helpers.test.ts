import { TEntityId } from '../../../../shared/types/uuid';
import { SYSTEM_CURRENCIES } from '../../../money/config/currencies.config';
import moneyValue from '../../../money/values/money.vo';
import journalEntryError from '../../errors/journal-entry.error';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
  UJournalEntrySourceType,
  UJournalEntryStatus,
} from '../../types/journal-entry.types';
import {
  EJournalSide,
  IJournalLine,
  UJournalSide,
} from '../../types/journal-line.types';
import helpers from '../helpers/journal-entry.entity.helpers';

describe('journalEntryEntityHelpers', () => {
  describe('validateStatus', () => {
    it('should not throw for valid statuses', () => {
      expect(() =>
        helpers.validateStatus(EJournalEntryStatus.Draft)
      ).not.toThrow();
      expect(() =>
        helpers.validateStatus(EJournalEntryStatus.Posted)
      ).not.toThrow();
      expect(() =>
        helpers.validateStatus(EJournalEntryStatus.Voided)
      ).not.toThrow();
      expect(() =>
        helpers.validateStatus(EJournalEntryStatus.Archived)
      ).not.toThrow();
    });

    it('should throw InvalidStatus for an invalid status', () => {
      expect(() =>
        helpers.validateStatus('invalid_status' as UJournalEntryStatus)
      ).toThrow(journalEntryError.InvalidStatus);
    });
  });

  describe('validateTransition', () => {
    it('should not throw if currentStatus is in allowedStatuses', () => {
      expect(() =>
        helpers.validateTransition(
          EJournalEntryStatus.Posted,
          EJournalEntryStatus.Voided,
          [EJournalEntryStatus.Posted]
        )
      ).not.toThrow();
    });

    it('should throw InvalidStatusTransition if currentStatus is not in allowedStatuses', () => {
      expect(() =>
        helpers.validateTransition(
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
      expect(helpers.isUniqueSequenceOrder(lines)).toBe(true);
    });

    it('should return false for duplicate sequence orders', () => {
      const lines = [
        { sequenceOrder: 1 } as IJournalLine,
        { sequenceOrder: 1 } as IJournalLine,
      ];
      expect(helpers.isUniqueSequenceOrder(lines)).toBe(false);
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
        helpers.validateLine([validDebitLine, validCreditLine])
      ).not.toThrow();
    });

    it('should throw InvalidLineItems if line length is less than 2', () => {
      expect(() => helpers.validateLine([])).toThrow(
        journalEntryError.InvalidLineItems
      );
      expect(() => helpers.validateLine([validDebitLine])).toThrow(
        journalEntryError.InvalidLineItems
      );
    });

    it('should throw InvalidJournalLineItem for invalid line side', () => {
      const invalidSideLine = {
        ...validDebitLine,
        side: 'invalid' as UJournalSide,
      };
      expect(() =>
        helpers.validateLine([invalidSideLine, validCreditLine])
      ).toThrow(journalEntryError.InvalidJournalLineItem);
    });

    it('should throw InvalidLineItems if there are no debits or no credits', () => {
      const doubleDebit = [
        validDebitLine,
        { ...validDebitLine, sequenceOrder: 2 },
      ];
      expect(() => helpers.validateLine(doubleDebit)).toThrow(
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
        helpers.validateLine([validDebitLine, unbalancedCredit])
      ).toThrow(journalEntryError.UnbalancedJournalEntry);
    });

    it('should throw DuplicateSequenceOrders if sequence orders are not unique', () => {
      const duplicateSequence = [
        validDebitLine,
        { ...validCreditLine, sequenceOrder: 1 },
      ];
      expect(() => helpers.validateLine(duplicateSequence)).toThrow(
        journalEntryError.DuplicateSequenceOrders
      );
    });
  });

  describe('getMemo', () => {
    it('should return null for null/empty string', () => {
      expect(helpers.getMemo(null)).toBeNull();
      expect(helpers.getMemo('')).toBeNull();
    });

    it('should return sanitized/trimmed string for a valid memo', () => {
      expect(helpers.getMemo('   A valid memo   ')).toBe('A valid memo');
    });

    it('should throw InvalidMemo for an overly long string', () => {
      expect(() => helpers.getMemo('a'.repeat(251))).toThrow(
        journalEntryError.InvalidMemo
      );
    });
  });

  describe('validateSourceType', () => {
    it('should not throw for valid source types', () => {
      expect(() =>
        helpers.validateSourceType(EJournalEntrySourceType.Receipt)
      ).not.toThrow();
    });

    it('should throw InvalidSourceType for invalid source type', () => {
      expect(() =>
        helpers.validateSourceType('invalid_source' as UJournalEntrySourceType)
      ).toThrow(journalEntryError.InvalidSourceType);
    });
  });

  describe('validateCounterparties', () => {
    it('should throw CounterpartyIdNotAllowed if source type is Transfer and any line has a counterparty', () => {
      const lineWithCounterparty = {
        counterpartyId: 'cp1' as TEntityId,
      } as IJournalLine;
      expect(() =>
        helpers.validateCounterparties(EJournalEntrySourceType.Transfer, [
          lineWithCounterparty,
        ])
      ).toThrow(journalEntryError.CounterpartyIdNotAllowed);
    });

    it('should not throw if source type is Transfer and no lines have a counterparty', () => {
      const lineWithoutCounterparty = { counterpartyId: null } as IJournalLine;
      expect(() =>
        helpers.validateCounterparties(EJournalEntrySourceType.Transfer, [
          lineWithoutCounterparty,
        ])
      ).not.toThrow();
    });

    it('should not throw for non-Transfer source types even if lines have a counterparty', () => {
      const lineWithCounterparty = {
        counterpartyId: 'cp1' as TEntityId,
      } as IJournalLine;
      expect(() =>
        helpers.validateCounterparties(EJournalEntrySourceType.Receipt, [
          lineWithCounterparty,
        ])
      ).not.toThrow();
    });
  });

  describe('validatePostedAt', () => {
    it('should not throw for null', () => {
      expect(() => helpers.validatePostedAt(null)).not.toThrow();
    });

    it('should not throw for a valid Date', () => {
      expect(() => helpers.validatePostedAt(new Date())).not.toThrow();
    });

    it('should throw InvalidPostingDate for an invalid Date', () => {
      expect(() => helpers.validatePostedAt(new Date('invalid-date'))).toThrow(
        journalEntryError.InvalidPostingDate
      );
    });
  });

  describe('validateVoidedAt', () => {
    it('should not throw for null', () => {
      expect(() => helpers.validateVoidedAt(null)).not.toThrow();
    });

    it('should not throw for a valid Date', () => {
      expect(() => helpers.validateVoidedAt(new Date())).not.toThrow();
    });

    it('should throw InvalidVoidedAt for an invalid Date', () => {
      expect(() => helpers.validateVoidedAt(new Date('invalid-date'))).toThrow(
        journalEntryError.InvalidVoidedAt
      );
    });
  });

  describe('validateVoidingEntryId', () => {
    it('should not throw for null', () => {
      expect(() => helpers.validateVoidingEntryId(null)).not.toThrow();
    });

    it('should not throw for a valid UUID', () => {
      expect(() =>
        helpers.validateVoidingEntryId(
          '4c6e83ef-2a1b-4c3d-8d9e-5e6f7a8b9c0d' as TEntityId
        )
      ).not.toThrow();
    });

    it('should throw InvalidValue for an invalid UUID format', () => {
      expect(() =>
        helpers.validateVoidingEntryId('invalid-uuid' as TEntityId)
      ).toThrow(journalEntryError.InvalidValue);
    });
  });
});
