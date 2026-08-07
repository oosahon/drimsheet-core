import generateUUID from '../../../../../shared/utils/uuid-generator';
import { ICurrency } from '../../../../money/types/currency.types';
import { TGiftsLedgerCode } from '../../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '../../../types/ledger.types';
import {
  ERevenueAccountBehavior,
  ERevenueSubType,
} from '../../types/revenue-account.types';
import giftsAccountEntity from '../gifts.entity';

describe('Gifts Revenue Entity', () => {
  const validUUID1 = generateUUID();
  const validUUID2 = generateUUID();

  const validCurrency: ICurrency = {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    minorUnit: 2,
  };

  const validParent = {
    precedingCode: '408000' as TGiftsLedgerCode,
    parentMaterializedPath: '408000' as TGiftsLedgerCode,
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
    it('should generate the next sub-ledger code for gifts accounts', () => {
      expect(giftsAccountEntity.getCode('408000')).toBe('408001');
      expect(giftsAccountEntity.getCode('408099')).toBe('408100');
    });

    it('should return 408000 if predecessorCode is null', () => {
      expect(giftsAccountEntity.getCode(null)).toBe('408000');
    });

    it('should throw if predecessor code does not match header code', () => {
      expect(() =>
        giftsAccountEntity.getCode('400000' as TGiftsLedgerCode)
      ).toThrow();
    });
  });

  describe('getMaterializedPath', () => {
    it('should return code if parentMaterializedPath is null', () => {
      expect(giftsAccountEntity.getMaterializedPath('408000', null)).toBe(
        '408000'
      );
    });

    it('should return concatenated path if parentMaterializedPath is provided', () => {
      expect(giftsAccountEntity.getMaterializedPath('408001', '408000')).toBe(
        '408000.408001'
      );
    });
  });

  describe('make', () => {
    const validPayload = {
      name: 'Birthday Gift',
      accountingEntityId: validUUID1,

      currency: validCurrency,
      createdBy: validUUID2,
      isControlAccount: false,
      controlAccountId: null,
      meta: null,
    };

    it('should successfully create a gifts account', () => {
      const [account, events] = giftsAccountEntity.make(
        validPayload,
        validParent
      );

      expect(account.code).toBe('408001');
      expect(account.materializedPath).toBe('408000.408001');
      expect(account.type).toBe(ELedgerType.Revenue);
      expect(account.normalBalance).toBe(ENormalBalance.Credit);
      expect(account.subType).toBe(ERevenueSubType.Gifts);
      expect(account.behavior).toBe(ERevenueAccountBehavior.Gifts);
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

      expect(account.name).toBe('Birthday Gift');
      expect(account.accountingEntityId).toBe(validUUID1);
      expect(account.createdBy).toBe(validUUID2);
      expect(account.currency).toEqual(validCurrency);
      expect(events).toHaveLength(2);
    });

    it('should throw if payload values are invalid', () => {
      const invalidPayload = { ...validPayload, name: 'A' };
      expect(() =>
        giftsAccountEntity.make(invalidPayload, validParent)
      ).toThrow();
    });

    it('should use base code 408000 when predecessorCode is null', () => {
      const [account] = giftsAccountEntity.make(validPayload, null);
      expect(account.code).toBe('408000');
      expect(account.materializedPath).toBe('408000');
    });
  });
});
