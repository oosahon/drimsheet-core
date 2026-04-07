import { AppError } from '../../../../../shared/value-objects/error';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import financeCostsAccountEntity from '../07-finance-costs.entity';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
  IInterestFinanceAccount,
} from '../../../types/expense-account.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '../../../types/ledger.types';

describe('Finance Costs Expense Entity', () => {
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
    it('should generate the next sub-ledger code for finance costs accounts', () => {
      expect(financeCostsAccountEntity.getCode('507000')).toBe('507001');
      expect(financeCostsAccountEntity.getCode('507099')).toBe('507100');
    });

    it('should throw if predecessor code does not match header code', () => {
      expect(() => financeCostsAccountEntity.getCode('508000' as any)).toThrow(
        AppError
      );
    });
  });

  describe('make', () => {
    const validPayload: Pick<
      IInterestFinanceAccount,
      | 'name'
      | 'createdBy'
      | 'accountingEntityId'
      | 'currency'
      | 'isControlAccount'
      | 'controlAccountId'
      | 'meta'
    > = {
      name: 'Interest on Short Term Loans',
      accountingEntityId: validUUID1,
      currency: validCurrency,
      createdBy: validUUID2,
      isControlAccount: false,
      controlAccountId: null,
      meta: null,
    };

    it('should successfully create a finance costs account', () => {
      const [account, events] = financeCostsAccountEntity.make(
        validPayload,
        '507000'
      );

      expect(account.code).toBe('507001');
      expect(account.type).toBe(ELedgerType.Expense);
      expect(account.normalBalance).toBe(ENormalBalance.Debit);
      expect(account.subType).toBe(EExpenseSubType.InterestAndFinanceCharges);
      expect(account.behavior).toBe(EExpenseAccountBehavior.FinanceCosts);
      expect(account.status).toBe(ELedgerAccountStatus.Active);
      expect(account.isControlAccount).toBe(false);
      expect(account.controlAccountId).toBeNull();
      expect(account.meta).toBeNull();
      expect(account.contraAccountRule).toBe(
        EContraAccountRule.ContraNotPermitted
      );
      expect(account.adjunctAccountRule).toBe(
        EAdjunctAccountRule.AdjunctNotPermitted
      );
      expect(account.createdBy).toBe(validUUID2);
      expect(account.accountingEntityId).toBe(validUUID1);
      expect(events).toHaveLength(1);
    });

    it('should successfully create a finance costs account with controlAccountId', () => {
      const validUUID3 = generateUUID();
      const payloadWithControl = {
        ...validPayload,
        isControlAccount: true,
        controlAccountId: validUUID3,
      };
      const [account, events] = financeCostsAccountEntity.make(
        payloadWithControl,
        '507000'
      );
      expect(account.isControlAccount).toBe(true);
      expect(account.controlAccountId).toBe(validUUID3);
      expect(events).toHaveLength(1);
    });

    it('should throw if payload values are invalid', () => {
      const invalidPayload = { ...validPayload, name: 'A' };
      expect(() =>
        financeCostsAccountEntity.make(invalidPayload, '507000')
      ).toThrow(AppError);
    });

    it('should throw if controlAccountId is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        controlAccountId: 'invalid-uuid' as any,
      };
      expect(() =>
        financeCostsAccountEntity.make(invalidPayload, '507000')
      ).toThrow(AppError);
    });

    it('should use base code 507000 when predecessorCode is null', () => {
      const [account] = financeCostsAccountEntity.make(validPayload, null);
      expect(account.code).toBe('507000');
    });
  });
});
