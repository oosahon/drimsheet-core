import { AppError } from '../../../../../shared/value-objects/error';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import liabilitySuspenseAccountEntity from '../99-suspense-account.entity';
import {
  ELiabilityAccountBehavior,
  ELiabilitySubType,
} from '../../../types/liability-account.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '../../../types/ledger.types';

describe('Liability Suspense Account Entity', () => {
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
    it('should generate the next sub-ledger code for liability suspense accounts', () => {
      expect(liabilitySuspenseAccountEntity.getCode('299000')).toBe('299001');
      expect(liabilitySuspenseAccountEntity.getCode('299099')).toBe('299100');
    });

    it('should throw if predecessor code does not match header code', () => {
      expect(() =>
        liabilitySuspenseAccountEntity.getCode('200000' as any)
      ).toThrow(AppError);
    });
  });

  describe('make', () => {
    const validSuspensePayload = {
      name: 'General Liability Suspense',
      accountingEntityId: validUUID1,
      currency: validCurrency,
      createdBy: validUUID2,
    };

    it('should successfully create a suspense account with all hardcoded restrictions', () => {
      const [account, events] = liabilitySuspenseAccountEntity.make(
        validSuspensePayload,
        '299000'
      );

      expect(account.code).toBe('299001');
      expect(account.type).toBe(ELedgerType.Liability);
      expect(account.normalBalance).toBe(ENormalBalance.Credit);
      expect(account.subType).toBe(ELiabilitySubType.Suspense);
      expect(account.behavior).toBe(ELiabilityAccountBehavior.Default);
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

      expect(account.name).toBe('General Liability Suspense');
      expect(account.accountingEntityId).toBe(validUUID1);
      expect(account.createdBy).toBe(validUUID2);
      expect(account.currency).toEqual(validCurrency);
      expect(events).toHaveLength(1);
    });

    it('should throw if the payload values are invalid', () => {
      const invalidPayload = { ...validSuspensePayload, name: 'A' }; // Too short
      expect(() =>
        liabilitySuspenseAccountEntity.make(invalidPayload, '299000')
      ).toThrow(AppError);

      const invalidPayload2 = {
        ...validSuspensePayload,
        accountingEntityId: 'invalid' as any,
      };
      expect(() =>
        liabilitySuspenseAccountEntity.make(invalidPayload2, '299000')
      ).toThrow(AppError);
    });
  });
});
