import generateUUID from '../../../../../shared/utils/uuid-generator';
import { TInterestLedgerCode } from '../../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '../../../types/ledger.types';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
  IInterestAccount,
} from '../../types/expense-account.types';
import interestAccountEntity from '../interest.entity';

describe('Interest Expense Entity', () => {
  const validUUID1 = generateUUID();
  const validUUID2 = generateUUID();

  const validCurrency: any = {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    minorUnit: 2,
  };

  const validParent = {
    precedingCode: '509000' as TInterestLedgerCode,
    parentMaterializedPath: '509000' as TInterestLedgerCode,
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
    it('should generate the next sub-ledger code for interest accounts', () => {
      expect(interestAccountEntity.getCode('509000')).toBe('509001');
      expect(interestAccountEntity.getCode('509099')).toBe('509100');
    });

    it('should return 509000 if predecessorCode is null', () => {
      expect(interestAccountEntity.getCode(null)).toBe('509000');
    });

    it('should throw if predecessor code does not match header code', () => {
      expect(() => interestAccountEntity.getCode('510000' as any)).toThrow();
    });
  });

  describe('getMaterializedPath', () => {
    it('should return code if parentMaterializedPath is null', () => {
      expect(interestAccountEntity.getMaterializedPath('509000', null)).toBe(
        '509000'
      );
    });

    it('should return concatenated path if parentMaterializedPath is provided', () => {
      expect(
        interestAccountEntity.getMaterializedPath('509001', '509000')
      ).toBe('509000.509001');
    });
  });

  describe('make', () => {
    const validPayload: Pick<
      IInterestAccount,
      | 'name'
      | 'createdBy'
      | 'accountingEntityId'
      | 'currency'
      | 'isControlAccount'
      | 'controlAccountId'
      | 'meta'
    > = {
      name: 'Loan Interest Expense',
      accountingEntityId: validUUID1,

      currency: validCurrency,
      createdBy: validUUID2,
      isControlAccount: false,
      controlAccountId: null,
      meta: null,
    };

    it('should successfully create an interest account', () => {
      const [account, events] = interestAccountEntity.make(
        validPayload,
        validParent
      );

      expect(account.code).toBe('509001');
      expect(account.materializedPath).toBe('509000.509001');
      expect(account.type).toBe(ELedgerType.Expense);
      expect(account.normalBalance).toBe(ENormalBalance.Debit);
      expect(account.subType).toBe(EExpenseSubType.Interest);
      expect(account.behavior).toBe(EExpenseAccountBehavior.Interest);
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

    it('should successfully create an interest account with controlAccountId', () => {
      const validUUID3 = generateUUID();
      const payloadWithControl = {
        ...validPayload,
        isControlAccount: true,
        controlAccountId: validUUID3,
      };
      const [account, events] = interestAccountEntity.make(
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
        interestAccountEntity.make(invalidPayload, validParent)
      ).toThrow();
    });

    it('should use base code 509000 when predecessorCode is null', () => {
      const [account] = interestAccountEntity.make(validPayload, null);
      expect(account.code).toBe('509000');
      expect(account.materializedPath).toBe('509000');
    });
  });
});
