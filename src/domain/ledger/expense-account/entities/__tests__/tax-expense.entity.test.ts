import generateUUID from '../../../../../shared/utils/uuid-generator';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
  IIncomeTaxExpenseAccount,
} from '../../../types/expense-account.types';
import { TIncomeTaxLedgerCode } from '../../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '../../../types/ledger.types';
import taxExpenseAccountEntity from '../tax-expense.entity';

describe('Tax Expense Entity', () => {
  const validUUID1 = generateUUID();
  const validUUID2 = generateUUID();

  const validCurrency: any = {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    minorUnit: 2,
  };

  const validParent = {
    precedingCode: '510000' as TIncomeTaxLedgerCode,
    parentMaterializedPath: '510000' as TIncomeTaxLedgerCode,
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
    it('should generate the next sub-ledger code for tax expense accounts', () => {
      expect(taxExpenseAccountEntity.getCode('510000')).toBe('510001');
      expect(taxExpenseAccountEntity.getCode('510099')).toBe('510100');
    });

    it('should return 510000 if predecessorCode is null', () => {
      expect(taxExpenseAccountEntity.getCode(null)).toBe('510000');
    });

    it('should throw if predecessor code does not match header code', () => {
      expect(() => taxExpenseAccountEntity.getCode('511000' as any)).toThrow();
    });
  });

  describe('getMaterializedPath', () => {
    it('should return code if parentMaterializedPath is null', () => {
      expect(taxExpenseAccountEntity.getMaterializedPath('510000', null)).toBe(
        '510000'
      );
    });

    it('should return concatenated path if parentMaterializedPath is provided', () => {
      expect(
        taxExpenseAccountEntity.getMaterializedPath('510001', '510000')
      ).toBe('510000.510001');
    });
  });

  describe('make', () => {
    const validPayload: Pick<
      IIncomeTaxExpenseAccount,
      | 'name'
      | 'createdBy'
      | 'accountingEntityId'
      | 'currency'
      | 'isControlAccount'
      | 'controlAccountId'
      | 'meta'
    > = {
      name: 'Corporate Income Tax',
      accountingEntityId: validUUID1,

      currency: validCurrency,
      createdBy: validUUID2,
      isControlAccount: false,
      controlAccountId: null,
      meta: null,
    };

    it('should successfully create a tax expense account', () => {
      const [account, events] = taxExpenseAccountEntity.make(
        validPayload,
        validParent
      );

      expect(account.code).toBe('510001');
      expect(account.materializedPath).toBe('510000.510001');
      expect(account.type).toBe(ELedgerType.Expense);
      expect(account.normalBalance).toBe(ENormalBalance.Debit);
      expect(account.subType).toBe(EExpenseSubType.IncomeTaxExpense);
      expect(account.behavior).toBe(EExpenseAccountBehavior.TaxExpense);
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

    it('should successfully create a tax expense account with controlAccountId', () => {
      const validUUID3 = generateUUID();
      const payloadWithControl = {
        ...validPayload,
        isControlAccount: true,
        controlAccountId: validUUID3,
      };
      const [account, events] = taxExpenseAccountEntity.make(
        payloadWithControl,
        validParent
      );
      expect(account.isControlAccount).toBe(true);
      expect(account.controlAccountId).toBe(validUUID3);
      expect(events).toHaveLength(1);
    });

    it('should throw if payload values are invalid', () => {
      const invalidPayload = { ...validPayload, name: 'A' };
      expect(() =>
        taxExpenseAccountEntity.make(invalidPayload, validParent)
      ).toThrow();
    });

    it('should use base code 510000 when predecessorCode is null', () => {
      const [account] = taxExpenseAccountEntity.make(validPayload, null);
      expect(account.code).toBe('510000');
      expect(account.materializedPath).toBe('510000');
    });
  });
});
