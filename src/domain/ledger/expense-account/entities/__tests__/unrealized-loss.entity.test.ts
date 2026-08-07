import generateUUID from '../../../../../shared/utils/uuid-generator';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
  IUnrealizedLossAccount,
} from '../../../types/expense-account.types';
import { TUnrealizedLossLedgerCode } from '../../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '../../../types/ledger.types';
import unrealizedLossAccountEntity from '../unrealized-loss.entity';

describe('Unrealized Loss Entity', () => {
  const validUUID1 = generateUUID();
  const validUUID2 = generateUUID();

  const validCurrency: any = {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    minorUnit: 2,
  };

  const validParent = {
    precedingCode: '511000' as TUnrealizedLossLedgerCode,
    parentMaterializedPath: '511000' as TUnrealizedLossLedgerCode,
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
    it('should generate the next sub-ledger code for unrealized loss accounts', () => {
      expect(unrealizedLossAccountEntity.getCode('511000')).toBe('511001');
      expect(unrealizedLossAccountEntity.getCode('511099')).toBe('511100');
    });

    it('should return 511000 if predecessorCode is null', () => {
      expect(unrealizedLossAccountEntity.getCode(null)).toBe('511000');
    });

    it('should throw if predecessor code does not match header code', () => {
      expect(() =>
        unrealizedLossAccountEntity.getCode('512000' as any)
      ).toThrow();
    });
  });

  describe('getMaterializedPath', () => {
    it('should return code if parentMaterializedPath is null', () => {
      expect(
        unrealizedLossAccountEntity.getMaterializedPath('511000', null)
      ).toBe('511000');
    });

    it('should return concatenated path if parentMaterializedPath is provided', () => {
      expect(
        unrealizedLossAccountEntity.getMaterializedPath('511001', '511000')
      ).toBe('511000.511001');
    });
  });

  describe('make', () => {
    const validPayload: Pick<
      IUnrealizedLossAccount,
      | 'name'
      | 'createdBy'
      | 'accountingEntityId'
      | 'currency'
      | 'isControlAccount'
      | 'controlAccountId'
      | 'meta'
    > = {
      name: 'Unrealized Exchange Loss',
      accountingEntityId: validUUID1,

      currency: validCurrency,
      createdBy: validUUID2,
      isControlAccount: false,
      controlAccountId: null,
      meta: null,
    };

    it('should successfully create an unrealized loss account', () => {
      const [account, events] = unrealizedLossAccountEntity.make(
        validPayload,
        validParent
      );

      expect(account.code).toBe('511001');
      expect(account.materializedPath).toBe('511000.511001');
      expect(account.type).toBe(ELedgerType.Expense);
      expect(account.normalBalance).toBe(ENormalBalance.Debit);
      expect(account.subType).toBe(EExpenseSubType.UnrealizedLoss);
      expect(account.behavior).toBe(EExpenseAccountBehavior.UnrealizedLoss);
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

    it('should successfully create an unrealized loss account with controlAccountId', () => {
      const validUUID3 = generateUUID();
      const payloadWithControl = {
        ...validPayload,
        isControlAccount: true,
        controlAccountId: validUUID3,
      };
      const [account, events] = unrealizedLossAccountEntity.make(
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
        unrealizedLossAccountEntity.make(invalidPayload, validParent)
      ).toThrow();
    });

    it('should use base code 511000 when predecessorCode is null', () => {
      const [account] = unrealizedLossAccountEntity.make(validPayload, null);
      expect(account.code).toBe('511000');
      expect(account.materializedPath).toBe('511000');
    });
  });
});
