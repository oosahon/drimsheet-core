import generateUUID from '../../../../../shared/utils/uuid-generator';
import { AppError } from '../../../../../shared/value-objects/error';
import { TGainOnAssetSaleLedgerCode } from '../../../types/ledger-code.types';
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
} from '../../../types/revenue-account.types';
import GainOnAssetSaleAccountEntity from '../06-gain-on-sale.entity';

describe('Gain on Sale Revenue Entity', () => {
  const validUUID1 = generateUUID();
  const validUUID2 = generateUUID();

  const validCurrency = {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    minorUnit: 2n,
  };

  const validParent = {
    precedingCode: '405000' as TGainOnAssetSaleLedgerCode,
    parentMaterializedPath: '405000' as TGainOnAssetSaleLedgerCode,
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
    it('should generate the next sub-ledger code for gain on sale accounts', () => {
      expect(GainOnAssetSaleAccountEntity.getCode('405000')).toBe('405001');
      expect(GainOnAssetSaleAccountEntity.getCode('405099')).toBe('405100');
    });

    it('should return 405000 if predecessorCode is null', () => {
      expect(GainOnAssetSaleAccountEntity.getCode(null)).toBe('405000');
    });

    it('should throw if predecessor code does not match header code', () => {
      expect(() =>
        GainOnAssetSaleAccountEntity.getCode('400000' as any)
      ).toThrow(AppError);
    });
  });

  describe('getMaterializedPath', () => {
    it('should return code if parentMaterializedPath is null', () => {
      expect(
        GainOnAssetSaleAccountEntity.getMaterializedPath('405000', null)
      ).toBe('405000');
    });

    it('should return concatenated path if parentMaterializedPath is provided', () => {
      expect(
        GainOnAssetSaleAccountEntity.getMaterializedPath('405001', '405000')
      ).toBe('405000.405001');
    });
  });

  describe('make', () => {
    const validPayload = {
      name: 'Gain on Sale of Property',
      accountingEntityId: validUUID1,
      accountingContextId: validUUID1,
      currency: validCurrency,
      createdBy: validUUID2,
      isControlAccount: false,
      controlAccountId: null,
      meta: null,
    };

    it('should successfully create a gain on sale account', () => {
      const [account, events] = GainOnAssetSaleAccountEntity.make(
        validPayload,
        validParent
      );

      expect(account.code).toBe('405001');
      expect(account.materializedPath).toBe('405000.405001');
      expect(account.type).toBe(ELedgerType.Revenue);
      expect(account.normalBalance).toBe(ENormalBalance.Credit);
      expect(account.subType).toBe(ERevenueSubType.GainOnAssetSale);
      expect(account.behavior).toBe(ERevenueAccountBehavior.GainOnAssetSale);
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

      expect(account.name).toBe('Gain on Sale of Property');
      expect(account.accountingEntityId).toBe(validUUID1);
      expect(account.createdBy).toBe(validUUID2);
      expect(account.currency).toEqual(validCurrency);
      expect(events).toHaveLength(2);
    });

    it('should throw if payload values are invalid', () => {
      const invalidPayload = { ...validPayload, name: 'A' };
      expect(() =>
        GainOnAssetSaleAccountEntity.make(invalidPayload, validParent)
      ).toThrow(AppError);
    });

    it('should use base code 405000 when predecessorCode is null', () => {
      const [account] = GainOnAssetSaleAccountEntity.make(validPayload, null);
      expect(account.code).toBe('405000');
      expect(account.materializedPath).toBe('405000');
    });
  });
});
