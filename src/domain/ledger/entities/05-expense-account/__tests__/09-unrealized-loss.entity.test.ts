import { AppError } from '../../../../../shared/value-objects/error';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import unrealizedLossAccountEntity from '../09-unrealized-loss.entity';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
  IUnrealizedLossAccount,
} from '../../../types/expense-account.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '../../../types/ledger.types';

describe('Unrealized Loss Entity', () => {
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
    it('should generate the next sub-ledger code for unrealized loss accounts', () => {
      expect(unrealizedLossAccountEntity.getCode('509000')).toBe('509001');
      expect(unrealizedLossAccountEntity.getCode('509099')).toBe('509100');
    });

    it('should throw if predecessor code does not match header code', () => {
      expect(() =>
        unrealizedLossAccountEntity.getCode('510000' as any)
      ).toThrow(AppError);
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
        '509000'
      );

      expect(account.code).toBe('509001');
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
        '509000'
      );
      expect(account.isControlAccount).toBe(true);
      expect(account.controlAccountId).toBe(validUUID3);
      expect(events).toHaveLength(1);
    });

    it('should throw if payload values are invalid', () => {
      const invalidPayload = { ...validPayload, name: 'A' };
      expect(() =>
        unrealizedLossAccountEntity.make(invalidPayload, '509000')
      ).toThrow(AppError);
    });

    it('should throw if controlAccountId is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        controlAccountId: 'invalid-uuid' as any,
      };
      expect(() =>
        unrealizedLossAccountEntity.make(invalidPayload, '509000')
      ).toThrow(AppError);
    });

    it('should use base code 509000 when predecessorCode is null', () => {
      const [account] = unrealizedLossAccountEntity.make(validPayload, null);
      expect(account.code).toBe('509000');
    });
  });
});
