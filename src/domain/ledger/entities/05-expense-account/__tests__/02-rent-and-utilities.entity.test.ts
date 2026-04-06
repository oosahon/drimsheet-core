import { AppError } from '../../../../../shared/value-objects/error';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import rentAndUtilitiesAccountEntity from '../02-rent-and-utilities.entity';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
  IRentUtilitiesAccount,
} from '../../../types/expense-account.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '../../../types/ledger.types';

describe('Rent and Utilities Expense Entity', () => {
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
    it('should generate the next sub-ledger code for rent and utilities accounts', () => {
      // Base code from ledger-code.types.ts for rent and utilities is 502
      expect(rentAndUtilitiesAccountEntity.getCode('502000')).toBe('502001');
      expect(rentAndUtilitiesAccountEntity.getCode('502099')).toBe('502100');
    });

    it('should throw if predecessor code does not match header code', () => {
      expect(() =>
        rentAndUtilitiesAccountEntity.getCode('503000' as any)
      ).toThrow(AppError);
    });
  });

  describe('make', () => {
    const validPayload: Pick<
      IRentUtilitiesAccount,
      | 'name'
      | 'createdBy'
      | 'accountingEntityId'
      | 'currency'
      | 'isControlAccount'
      | 'controlAccountId'
      | 'meta'
    > = {
      name: 'Office Rent',
      accountingEntityId: validUUID1,
      currency: validCurrency,
      createdBy: validUUID2,
      isControlAccount: false,
      controlAccountId: null,
      meta: null,
    };

    it('should successfully create a rent and utilities account', () => {
      const [account, events] = rentAndUtilitiesAccountEntity.make(
        validPayload,
        '502000'
      );

      expect(account.code).toBe('502001');
      expect(account.type).toBe(ELedgerType.Expense);
      expect(account.normalBalance).toBe(ENormalBalance.Debit);
      expect(account.subType).toBe(EExpenseSubType.RentAndUtilities);
      expect(account.behavior).toBe(EExpenseAccountBehavior.RentAndUtilities);
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

    it('should successfully create a rent and utilities account with controlAccountId', () => {
      const validUUID3 = generateUUID();
      const payloadWithControl = {
        ...validPayload,
        isControlAccount: true,
        controlAccountId: validUUID3,
      };
      const [account, events] = rentAndUtilitiesAccountEntity.make(
        payloadWithControl,
        '502000'
      );
      expect(account.isControlAccount).toBe(true);
      expect(account.controlAccountId).toBe(validUUID3);
      expect(events).toHaveLength(1);
    });

    it('should throw if payload values are invalid', () => {
      const invalidPayload = { ...validPayload, name: 'A' };
      expect(() =>
        rentAndUtilitiesAccountEntity.make(invalidPayload, '502000')
      ).toThrow(AppError);
    });

    it('should throw if controlAccountId is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        controlAccountId: 'invalid-uuid' as any,
      };
      expect(() =>
        rentAndUtilitiesAccountEntity.make(invalidPayload, '502000')
      ).toThrow(AppError);
    });

    it('should use base code 502000 when predecessorCode is null', () => {
      const [account] = rentAndUtilitiesAccountEntity.make(validPayload, null);
      expect(account.code).toBe('502000');
    });
  });
});
