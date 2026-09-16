import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
} from '@domain/journal-entry/types/journal-entry.types';
import { EJournalSide } from '@domain/journal-entry/types/journal-line.types';

import { EJournalEntrySortBy } from '@app/journal-entry/contracts/journal-entry.query.repo.contract';
import {
  getJournalEntriesQueryValidationSchema,
  journalEntrySideValidation,
  journalEntrySourceTypeValidation,
  journalEntryStatusValidation,
  journalLineReqValidation,
} from '@app/journal-entry/dtos/journal-entry/journal-entry.dto.validation';

describe('Journal Entry DTO Validation', () => {
  describe('getJournalEntriesQueryValidationSchema', () => {
    it('validates pagination and account filters', () => {
      const result = getJournalEntriesQueryValidationSchema.safeParse({
        accountId: '2b4c1064-a09e-4e4f-b6a3-23945cc87f74',
        page: 2,
        limit: 25,
        orderBy: EJournalEntrySortBy.EffectiveDate,
        sortDirection: 'asc',
        search: 'invoice',
      });

      expect(result.success).toBe(true);
    });

    it('validates an empty query', () => {
      expect(getJournalEntriesQueryValidationSchema.safeParse({}).success).toBe(
        true
      );
    });

    it.each([
      [{ accountId: 'invalid-account-id' }],
      [{ page: 0 }],
      [{ limit: 0 }],
      [{ orderBy: 'memo' }],
    ])('rejects invalid query values', (query) => {
      expect(
        getJournalEntriesQueryValidationSchema.safeParse(query).success
      ).toBe(false);
    });
  });

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
        counterparty: {
          id: '1b4c1064-a09e-4e4f-b6a3-23945cc87f75',
          name: 'Acme Corp',
        },
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
        counterparty: null,
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

    it('should validate a named counterparty without an ID', () => {
      const result = journalLineReqValidation.safeParse({
        accountId: '2b4c1064-a09e-4e4f-b6a3-23945cc87f74',
        counterparty: { name: 'New supplier' },
        amount: {
          amount: 1500,
          currencyCode: 'USD',
          isMinorUnit: true,
        },
        exchangeRate: null,
        description: 'New counterparty transaction',
        sequenceOrder: 1,
      });

      expect(result.success).toBe(true);
    });

    it('should fail validation on invalid counterparty UUID', () => {
      const result = journalLineReqValidation.safeParse({
        accountId: '2b4c1064-a09e-4e4f-b6a3-23945cc87f74',
        counterparty: {
          id: 'invalid-counterparty-id',
          name: 'Acme Corp',
        },
        amount: {
          amount: 1500,
          currencyCode: 'USD',
          isMinorUnit: true,
        },
        exchangeRate: null,
        description: 'Test transaction description',
        sequenceOrder: 1,
      });

      expect(result.success).toBe(false);
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
