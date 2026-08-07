import generateUUID from '../../../../../shared/utils/uuid-generator';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
  IBankChargeAccount,
} from '../../../types/expense-account.types';
import { TBankChargeLedgerCode } from '../../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '../../../types/ledger.types';
import bankChargeAccountEntity from '../bank-charge.entity';

describe('Bank Charge Expense Entity', () => {
  const validUUID1 = generateUUID();
  const validUUID2 = generateUUID();

  const validCurrency: any = {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    minorUnit: 2,
  };

  const validParent = {
    precedingCode: '507000' as TBankChargeLedgerCode,
    parentMaterializedPath: '507000' as TBankChargeLedgerCode,
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
    it('should generate the next sub-ledger code for bank charge accounts', () => {
      expect(bankChargeAccountEntity.getCode('507000')).toBe('507001');
      expect(bankChargeAccountEntity.getCode('507099')).toBe('507100');
    });

    it('should return 507000 if predecessorCode is null', () => {
      expect(bankChargeAccountEntity.getCode(null)).toBe('507000');
    });

    it('should throw if predecessor code does not match header code', () => {
      expect(() => bankChargeAccountEntity.getCode('508000' as any)).toThrow();
    });
  });

  describe('getMaterializedPath', () => {
    it('should return code if parentMaterializedPath is null', () => {
      expect(bankChargeAccountEntity.getMaterializedPath('507000', null)).toBe(
        '507000'
      );
    });

    it('should return concatenated path if parentMaterializedPath is provided', () => {
      expect(
        bankChargeAccountEntity.getMaterializedPath('507001', '507000')
      ).toBe('507000.507001');
    });
  });

  describe('make', () => {
    const validPayload: Pick<
      IBankChargeAccount,
      | 'name'
      | 'createdBy'
      | 'accountingEntityId'
      | 'currency'
      | 'isControlAccount'
      | 'controlAccountId'
      | 'meta'
    > = {
      name: 'Monthly Maintenance Fee',
      accountingEntityId: validUUID1,

      currency: validCurrency,
      createdBy: validUUID2,
      isControlAccount: false,
      controlAccountId: null,
      meta: null,
    };

    it('should successfully create a bank charge account', () => {
      const [account, events] = bankChargeAccountEntity.make(
        validPayload,
        validParent
      );

      expect(account.code).toBe('507001');
      expect(account.materializedPath).toBe('507000.507001');
      expect(account.type).toBe(ELedgerType.Expense);
      expect(account.normalBalance).toBe(ENormalBalance.Debit);
      expect(account.subType).toBe(EExpenseSubType.BankCharge);
      expect(account.behavior).toBe(EExpenseAccountBehavior.BankCharge);
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

    it('should successfully create a bank charge account with controlAccountId', () => {
      const validUUID3 = generateUUID();
      const payloadWithControl = {
        ...validPayload,
        isControlAccount: true,
        controlAccountId: validUUID3,
      };
      const [account, events] = bankChargeAccountEntity.make(
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
        bankChargeAccountEntity.make(invalidPayload, validParent)
      ).toThrow();
    });

    it('should use base code 507000 when predecessorCode is null', () => {
      const [account] = bankChargeAccountEntity.make(validPayload, null);
      expect(account.code).toBe('507000');
      expect(account.materializedPath).toBe('507000');
    });
  });
});
