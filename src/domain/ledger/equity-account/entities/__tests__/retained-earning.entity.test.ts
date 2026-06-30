import generateUUID from '../../../../../shared/utils/uuid-generator';
import { TRetainedEarningsLedgerCode } from '../../../shared/types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '../../../shared/types/ledger.types';
import {
  EEquityAccountBehavior,
  EEquitySubType,
} from '../../types/equity-account.types';
import retainedEarningAccountEntity from '../retained-earning.entity';

describe('Retained Earning Entity', () => {
  const validUUID1 = generateUUID();
  const validUUID2 = generateUUID();

  const validCurrency: any = {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    minorUnit: 2n,
  };

  const validParent = {
    precedingCode: '301000' as TRetainedEarningsLedgerCode,
    parentMaterializedPath: '301000' as TRetainedEarningsLedgerCode,
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
    it('should generate the next sub-ledger code for retained earning accounts', () => {
      expect(retainedEarningAccountEntity.getCode('301000')).toBe('301001');
      expect(retainedEarningAccountEntity.getCode('301099')).toBe('301100');
    });

    it('should return 301000 if predecessorCode is null', () => {
      expect(retainedEarningAccountEntity.getCode(null)).toBe('301000');
    });

    it('should throw if predecessor code does not match header code', () => {
      expect(() =>
        retainedEarningAccountEntity.getCode('300000' as any)
      ).toThrow();
    });
  });

  describe('getMaterializedPath', () => {
    it('should return code if parentMaterializedPath is null', () => {
      expect(
        retainedEarningAccountEntity.getMaterializedPath('301000', null)
      ).toBe('301000');
    });

    it('should return concatenated path if parentMaterializedPath is provided', () => {
      expect(
        retainedEarningAccountEntity.getMaterializedPath('301001', '301000')
      ).toBe('301000.301001');
    });
  });

  describe('make', () => {
    const validPayload = {
      name: 'Retained Earnings',
      accountingEntityId: validUUID1,

      currency: validCurrency,
      createdBy: validUUID2,
    };

    it('should successfully create a retained earning account', () => {
      const [account, events] = retainedEarningAccountEntity.make(
        validPayload,
        validParent
      );

      expect(account.code).toBe('301001');
      expect(account.materializedPath).toBe('301000.301001');
      expect(account.type).toBe(ELedgerType.Equity);
      expect(account.normalBalance).toBe(ENormalBalance.Credit);
      expect(account.subType).toBe(EEquitySubType.RetainedEarnings);
      expect(account.behavior).toBe(EEquityAccountBehavior.RetainedEarnings);
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

      expect(account.name).toBe('Retained Earnings');
      expect(account.accountingEntityId).toBe(validUUID1);
      expect(account.createdBy).toBe(validUUID2);
      expect(account.currency).toEqual(validCurrency);
      expect(events).toHaveLength(2);
    });

    it('should throw if payload values are invalid', () => {
      const invalidPayload = { ...validPayload, name: 'A' };
      expect(() =>
        retainedEarningAccountEntity.make(invalidPayload, validParent)
      ).toThrow();
    });

    it('should use base code 301000 when predecessorCode is null', () => {
      const [account] = retainedEarningAccountEntity.make(validPayload, null);
      expect(account.code).toBe('301000');
      expect(account.materializedPath).toBe('301000');
    });
  });
});
