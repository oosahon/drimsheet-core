import generateUUID from '../../../../../shared/utils/uuid-generator';
import { TFinanceCostLedgerCode } from '../../../shared/types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '../../../shared/types/ledger.types';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
  IFinanceCostAccount,
} from '../../types/expense-account.types';
import financeCostAccountEntity from '../finance-cost.entity';

describe('Finance Cost Expense Entity', () => {
  const validUUID1 = generateUUID();
  const validUUID2 = generateUUID();

  const validCurrency: any = {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    minorUnit: 2,
  };

  const validParent = {
    precedingCode: '508000' as TFinanceCostLedgerCode,
    parentMaterializedPath: '508000' as TFinanceCostLedgerCode,
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
    it('should generate the next sub-ledger code for finance cost accounts', () => {
      expect(financeCostAccountEntity.getCode('508000')).toBe('508001');
      expect(financeCostAccountEntity.getCode('508099')).toBe('508100');
    });

    it('should return 508000 if predecessorCode is null', () => {
      expect(financeCostAccountEntity.getCode(null)).toBe('508000');
    });

    it('should throw if predecessor code does not match header code', () => {
      expect(() => financeCostAccountEntity.getCode('509000' as any)).toThrow();
    });
  });

  describe('getMaterializedPath', () => {
    it('should return code if parentMaterializedPath is null', () => {
      expect(financeCostAccountEntity.getMaterializedPath('508000', null)).toBe(
        '508000'
      );
    });

    it('should return concatenated path if parentMaterializedPath is provided', () => {
      expect(
        financeCostAccountEntity.getMaterializedPath('508001', '508000')
      ).toBe('508000.508001');
    });
  });

  describe('make', () => {
    const validPayload: Pick<
      IFinanceCostAccount,
      | 'name'
      | 'createdBy'
      | 'accountingEntityId'
      | 'currency'
      | 'isControlAccount'
      | 'controlAccountId'
      | 'meta'
    > = {
      name: 'Credit Facility Fee',
      accountingEntityId: validUUID1,

      currency: validCurrency,
      createdBy: validUUID2,
      isControlAccount: false,
      controlAccountId: null,
      meta: null,
    };

    it('should successfully create a finance cost account', () => {
      const [account, events] = financeCostAccountEntity.make(
        validPayload,
        validParent
      );

      expect(account.code).toBe('508001');
      expect(account.materializedPath).toBe('508000.508001');
      expect(account.type).toBe(ELedgerType.Expense);
      expect(account.normalBalance).toBe(ENormalBalance.Debit);
      expect(account.subType).toBe(EExpenseSubType.FinanceCost);
      expect(account.behavior).toBe(EExpenseAccountBehavior.FinanceCost);
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
      expect(events).toHaveLength(2);
    });

    it('should successfully create a finance cost account with controlAccountId', () => {
      const validUUID3 = generateUUID();
      const payloadWithControl = {
        ...validPayload,
        isControlAccount: true,
        controlAccountId: validUUID3,
      };
      const [account, events] = financeCostAccountEntity.make(
        payloadWithControl,
        validParent
      );
      expect(account.isControlAccount).toBe(true);
      expect(account.controlAccountId).toBe(validUUID3);
      expect(events).toHaveLength(2);
    });

    it('should throw if payload values are invalid', () => {
      const invalidPayload = { ...validPayload, name: 'A' };
      expect(() =>
        financeCostAccountEntity.make(invalidPayload, validParent)
      ).toThrow();
    });

    it('should use base code 508000 when predecessorCode is null', () => {
      const [account] = financeCostAccountEntity.make(validPayload, null);
      expect(account.code).toBe('508000');
      expect(account.materializedPath).toBe('508000');
    });
  });
});
