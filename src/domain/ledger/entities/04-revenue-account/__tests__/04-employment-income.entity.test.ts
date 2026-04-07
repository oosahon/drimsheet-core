import { AppError } from '../../../../../shared/value-objects/error';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import employmentIncomeAccountEntity from '../04-employment-income.entity';
import {
  ERevenueAccountBehavior,
  ERevenueSubType,
} from '../../../types/revenue-account.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '../../../types/ledger.types';

describe('Employment Income Revenue Entity', () => {
  const validUUID1 = generateUUID();
  const validUUID2 = generateUUID();

  const validCurrency = {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    minorUnit: 2n,
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('getCode', () => {
    it('should generate the next sub-ledger code for employment income accounts', () => {
      expect(employmentIncomeAccountEntity.getCode('403000')).toBe('403001');
      expect(employmentIncomeAccountEntity.getCode('403099')).toBe('403100');
    });

    it('should throw if predecessor code does not match header code', () => {
      expect(() =>
        employmentIncomeAccountEntity.getCode('400000' as any)
      ).toThrow(AppError);
    });
  });

  describe('make', () => {
    const validPayload = {
      name: 'Salary - ACME Corp',
      accountingEntityId: validUUID1,
      currency: validCurrency,
      createdBy: validUUID2,
      isControlAccount: false,
      controlAccountId: null,
      meta: null,
    };

    it('should successfully create an employment income account', () => {
      const [account, events] = employmentIncomeAccountEntity.make(
        validPayload,
        '403000'
      );

      expect(account.code).toBe('403001');
      expect(account.type).toBe(ELedgerType.Revenue);
      expect(account.normalBalance).toBe(ENormalBalance.Credit);
      expect(account.subType).toBe(ERevenueSubType.EmploymentIncome);
      expect(account.behavior).toBe(ERevenueAccountBehavior.EmploymentIncome);
      expect(account.meta).toBeNull();
      expect(account.isControlAccount).toBe(false);
      expect(account.controlAccountId).toBeNull();
      expect(account.status).toBe(ELedgerAccountStatus.Active);
      expect(account.contraAccountRule).toBe(
        EContraAccountRule.ContraNotPermitted
      );
      expect(account.adjunctAccountRule).toBe(
        EAdjunctAccountRule.AdjunctNotPermitted
      );

      expect(account.name).toBe('Salary - ACME Corp');
      expect(account.accountingEntityId).toBe(validUUID1);
      expect(account.createdBy).toBe(validUUID2);
      expect(account.currency).toEqual(validCurrency);
      expect(events).toHaveLength(1);
    });

    it('should throw if payload values are invalid', () => {
      const invalidPayload = { ...validPayload, name: 'A' };
      expect(() =>
        employmentIncomeAccountEntity.make(invalidPayload, '403000')
      ).toThrow(AppError);
    });

    it('should use base code 403000 when predecessorCode is null', () => {
      const [account] = employmentIncomeAccountEntity.make(validPayload, null);
      expect(account.code).toBe('403000');
    });
  });
});
