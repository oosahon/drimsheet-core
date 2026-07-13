import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
} from '../../../../../domain/journal-entry/types/journal-entry.types';
import { EJournalSide } from '../../../../../domain/journal-entry/types/journal-line.types';
import {
  journalEntrySideValidation,
  journalEntrySourceTypeValidation,
  journalEntryStatusValidation,
  journalLineReqValidation,
} from '../journal-entry.dto.validation';

describe('Journal Entry DTO Validation', () => {
  describe('journalEntrySourceTypeValidation', () => {
    it('should validate valid source types', () => {
      expect(
        journalEntrySourceTypeValidation.safeParse(EJournalEntrySourceType.Sale)
          .success
      ).toBe(true);
      expect(
        journalEntrySourceTypeValidation.safeParse(
          EJournalEntrySourceType.Purchase
        ).success
      ).toBe(true);
    });

    it('should fail on invalid source type', () => {
      expect(
        journalEntrySourceTypeValidation.safeParse('invalid_source').success
      ).toBe(false);
    });
  });

  describe('journalEntrySideValidation', () => {
    it('should validate valid sides', () => {
      expect(
        journalEntrySideValidation.safeParse(EJournalSide.Debit).success
      ).toBe(true);
      expect(
        journalEntrySideValidation.safeParse(EJournalSide.Credit).success
      ).toBe(true);
    });

    it('should fail on invalid side', () => {
      expect(journalEntrySideValidation.safeParse('invalid_side').success).toBe(
        false
      );
    });
  });

  describe('journalEntryStatusValidation', () => {
    it('should validate valid statuses', () => {
      expect(
        journalEntryStatusValidation.safeParse(EJournalEntryStatus.Draft)
          .success
      ).toBe(true);
      expect(
        journalEntryStatusValidation.safeParse(EJournalEntryStatus.Posted)
          .success
      ).toBe(true);
    });

    it('should fail on invalid status', () => {
      expect(
        journalEntryStatusValidation.safeParse('invalid_status').success
      ).toBe(false);
    });
  });

  describe('journalLineReqValidation', () => {
    it('should validate a correct journal line payload', () => {
      const payload = {
        accountId: '2b4c1064-a09e-4e4f-b6a3-23945cc87f74',
        amount: {
          amount: 1500,
          currencyCode: 'USD',
          isMinorUnit: true,
        },
        exchangeRate: null,
        description: 'Test transaction description',
        sequenceOrder: 1,
      };

      const result = journalLineReqValidation.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should validate correct payload with optional exchangeRate', () => {
      const payload = {
        accountId: '2b4c1064-a09e-4e4f-b6a3-23945cc87f74',
        amount: {
          amount: 1500,
          currencyCode: 'USD',
          isMinorUnit: true,
        },
        exchangeRate: {
          baseCurrencyCode: 'EUR',
          targetCurrencyCode: 'USD',
          rate: 1.1,
          type: 'market',
          asOf: '2026-07-13T18:00:00Z',
          source: 'OpenExchange',
        },
        description: null,
        sequenceOrder: 2,
      };

      const result = journalLineReqValidation.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should fail validation on invalid account UUID', () => {
      const payload = {
        accountId: 'invalid-uuid',
        amount: {
          amount: 1500,
          currencyCode: 'USD',
          isMinorUnit: true,
        },
        exchangeRate: null,
        description: 'Test description',
        sequenceOrder: 1,
      };

      const result = journalLineReqValidation.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should fail validation if description is too long', () => {
      const payload = {
        accountId: '2b4c1064-a09e-4e4f-b6a3-23945cc87f74',
        amount: {
          amount: 1500,
          currencyCode: 'USD',
          isMinorUnit: true,
        },
        exchangeRate: null,
        description: 'a'.repeat(101),
        sequenceOrder: 1,
      };

      const result = journalLineReqValidation.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should fail validation if description is empty string', () => {
      const payload = {
        accountId: '2b4c1064-a09e-4e4f-b6a3-23945cc87f74',
        amount: {
          amount: 1500,
          currencyCode: 'USD',
          isMinorUnit: true,
        },
        exchangeRate: null,
        description: '',
        sequenceOrder: 1,
      };

      const result = journalLineReqValidation.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should fail validation if sequenceOrder is not positive', () => {
      const payload = {
        accountId: '2b4c1064-a09e-4e4f-b6a3-23945cc87f74',
        amount: {
          amount: 1500,
          currencyCode: 'USD',
          isMinorUnit: true,
        },
        exchangeRate: null,
        description: 'Test',
        sequenceOrder: 0,
      };

      const result = journalLineReqValidation.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });
});
