import { ELedgerAccountSortBy } from '../../../../../domain/ledger/shared/repos/ledger-account.repo';
import { ELedgerAccountBehavior } from '../../../../../domain/ledger/shared/types/account-behaviors.tyypes';
import { ELedgerAccountSubType } from '../../../../../domain/ledger/shared/types/ledger-aggregate.types';
import { ELedgerType } from '../../../../../domain/ledger/shared/types/ledger.types';
import {
  getLedgerAccountQueryValidationSchema,
  ledgerAccountBehaviorValidation,
  ledgerAccountOrderByValidationSchema,
  ledgerAccountSubTypeValidation,
  ledgerAccountTypeValidation,
} from '../ledger-account.dto.validation';

describe('Ledger Account DTO Validation', () => {
  describe('ledgerAccountTypeValidation', () => {
    it('should validate valid ledger account types', () => {
      expect(
        ledgerAccountTypeValidation.safeParse(ELedgerType.Asset).success
      ).toBe(true);
      expect(
        ledgerAccountTypeValidation.safeParse(ELedgerType.Liability).success
      ).toBe(true);
    });

    it('should fail on invalid ledger account type', () => {
      expect(
        ledgerAccountTypeValidation.safeParse('invalid_type').success
      ).toBe(false);
    });
  });

  describe('ledgerAccountOrderByValidationSchema', () => {
    it('should validate valid order by options', () => {
      expect(
        ledgerAccountOrderByValidationSchema.safeParse(
          ELedgerAccountSortBy.AccountName
        ).success
      ).toBe(true);
      expect(
        ledgerAccountOrderByValidationSchema.safeParse(
          ELedgerAccountSortBy.CreatedAt
        ).success
      ).toBe(true);
    });

    it('should fail on invalid order by options', () => {
      expect(
        ledgerAccountOrderByValidationSchema.safeParse('invalid_order_by')
          .success
      ).toBe(false);
    });
  });

  describe('ledgerAccountSubTypeValidation', () => {
    it('should validate valid sub-types', () => {
      expect(
        ledgerAccountSubTypeValidation.safeParse(
          ELedgerAccountSubType.CashAndCashEquivalent
        ).success
      ).toBe(true);
      expect(
        ledgerAccountSubTypeValidation.safeParse(
          ELedgerAccountSubType.Receivables
        ).success
      ).toBe(true);
    });

    it('should fail on invalid sub-types', () => {
      expect(
        ledgerAccountSubTypeValidation.safeParse('invalid_sub_type').success
      ).toBe(false);
    });
  });

  describe('ledgerAccountBehaviorValidation', () => {
    it('should validate valid behaviors', () => {
      expect(
        ledgerAccountBehaviorValidation.safeParse(ELedgerAccountBehavior.Bank)
          .success
      ).toBe(true);
      expect(
        ledgerAccountBehaviorValidation.safeParse(
          ELedgerAccountBehavior.Default
        ).success
      ).toBe(true);
    });

    it('should fail on invalid behaviors', () => {
      expect(
        ledgerAccountBehaviorValidation.safeParse('invalid_behavior').success
      ).toBe(false);
    });
  });

  describe('getLedgerAccountQueryValidationSchema', () => {
    it('should validate correct queries', () => {
      const payload = {
        limit: 20,
        page: 1,
        type: ELedgerType.Asset,
        subType: ELedgerAccountSubType.CashAndCashEquivalent,
        behavior: ELedgerAccountBehavior.Bank,
        isControlAccount: true,
        orderBy: ELedgerAccountSortBy.AccountName,
      };
      expect(
        getLedgerAccountQueryValidationSchema.safeParse(payload).success
      ).toBe(true);
    });

    it('should validate with optional fields omitted', () => {
      const payload = {
        limit: 10,
        page: 2,
      };
      expect(
        getLedgerAccountQueryValidationSchema.safeParse(payload).success
      ).toBe(true);
    });

    it('should fail if fields have invalid types', () => {
      const payload = {
        limit: 'ten', // should be number
      };
      expect(
        getLedgerAccountQueryValidationSchema.safeParse(payload).success
      ).toBe(false);
    });
  });
});
