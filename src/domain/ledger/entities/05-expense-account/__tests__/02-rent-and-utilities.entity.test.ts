import generateUUID from '../../../../../shared/utils/uuid-generator';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
  IRentUtilitiesAccount,
} from '../../../types/expense-account.types';
import { TRentUtilitiesLedgerCode } from '../../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '../../../types/ledger.types';
import rentAndUtilitiesAccountEntity from '../02-rent-and-utilities.entity';

describe('Rent and Utilities Expense Entity', () => {
  const validUUID1 = generateUUID();
  const validUUID2 = generateUUID();

  const validCurrency: any = {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    minorUnit: 2n,
  };

  const validParent = {
    precedingCode: '502000' as TRentUtilitiesLedgerCode,
    parentMaterializedPath: '502000' as TRentUtilitiesLedgerCode,
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

    it('should return 502000 if predecessorCode is null', () => {
      expect(rentAndUtilitiesAccountEntity.getCode(null)).toBe('502000');
    });

    it('should throw if predecessor code does not match header code', () => {
      expect(() =>
        rentAndUtilitiesAccountEntity.getCode('503000' as any)
      ).toThrow();
    });
  });

  describe('getMaterializedPath', () => {
    it('should return code if parentMaterializedPath is null', () => {
      expect(
        rentAndUtilitiesAccountEntity.getMaterializedPath('502000', null)
      ).toBe('502000');
    });

    it('should return concatenated path if parentMaterializedPath is provided', () => {
      expect(
        rentAndUtilitiesAccountEntity.getMaterializedPath('502001', '502000')
      ).toBe('502000.502001');
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
        validParent
      );

      expect(account.code).toBe('502001');
      expect(account.materializedPath).toBe('502000.502001');
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
      expect(events).toHaveLength(2);
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
        validParent
      );
      expect(account.isControlAccount).toBe(true);
      expect(account.controlAccountId).toBe(validUUID3);
      expect(events).toHaveLength(2);
    });

    it('should throw if payload values are invalid', () => {
      const invalidPayload = { ...validPayload, name: 'A' };
      expect(() =>
        rentAndUtilitiesAccountEntity.make(invalidPayload, validParent)
      ).toThrow();
    });

    it('should throw if controlAccountId is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        controlAccountId: 'invalid-uuid' as any,
      };
      expect(() =>
        rentAndUtilitiesAccountEntity.make(invalidPayload, validParent)
      ).toThrow();
    });

    it('should use base code 502000 when predecessorCode is null', () => {
      const [account] = rentAndUtilitiesAccountEntity.make(validPayload, null);
      expect(account.code).toBe('502000');
      expect(account.materializedPath).toBe('502000');
    });
  });
});
