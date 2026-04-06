import { AppError } from '../../../../../shared/value-objects/error';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import unrealizedGainAccountEntity from '../07-unrealized-gain.entity';
import {
  ERevenueAccountBehavior,
  ERevenueSubType,
} from '../../../types/revenue-account.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '../../../types/ledger.types';

describe('Unrealized Gains Revenue Entity', () => {
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
    it('should generate the next sub-ledger code for unrealized gains accounts', () => {
      expect(unrealizedGainAccountEntity.getCode('406000')).toBe('406001');
      expect(unrealizedGainAccountEntity.getCode('406099')).toBe('406100');
    });

    it('should throw if predecessor code does not match header code', () => {
      expect(() =>
        unrealizedGainAccountEntity.getCode('400000' as any)
      ).toThrow(AppError);
    });
  });

  describe('make', () => {
    const validPayload = {
      name: 'Unrealized Gains - Crypto',
      accountingEntityId: validUUID1,
      currency: validCurrency,
      createdBy: validUUID2,
      isControlAccount: false,
      controlAccountId: null,
      meta: null,
    };

    it('should successfully create an unrealized gains account', () => {
      const [account, events] = unrealizedGainAccountEntity.make(
        validPayload,
        '406000'
      );

      expect(account.code).toBe('406001');
      expect(account.type).toBe(ELedgerType.Revenue);
      expect(account.normalBalance).toBe(ENormalBalance.Credit);
      expect(account.subType).toBe(ERevenueSubType.UnrealizedGains);
      expect(account.behavior).toBe(ERevenueAccountBehavior.UnrealizedGains);
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

      expect(account.name).toBe('Unrealized Gains - Crypto');
      expect(account.accountingEntityId).toBe(validUUID1);
      expect(account.createdBy).toBe(validUUID2);
      expect(account.currency).toEqual(validCurrency);
      expect(events).toHaveLength(1);
    });

    it('should throw if payload values are invalid', () => {
      const invalidPayload = { ...validPayload, name: 'A' };
      expect(() =>
        unrealizedGainAccountEntity.make(invalidPayload, '406000')
      ).toThrow(AppError);
    });

    it('should use base code 406000 when predecessorCode is null', () => {
      const [account] = unrealizedGainAccountEntity.make(validPayload, null);
      expect(account.code).toBe('406000');
    });
  });
});
