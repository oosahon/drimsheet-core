import { AppError } from '../../../../../shared/value-objects/error';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import openingBalanceEquityLedgerEntity from '../99-opening-balance.equity';
import {
  EEquityAccountBehavior,
  EEquitySubType,
} from '../../../types/equity-account.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '../../../types/ledger.types';

describe('Opening Balance Equity Entity', () => {
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
    it('should generate the next sub-ledger code for opening balance equity accounts', () => {
      expect(openingBalanceEquityLedgerEntity.getCode('399000')).toBe('399001');
      expect(openingBalanceEquityLedgerEntity.getCode('399099')).toBe('399100');
    });

    it('should throw if predecessor code does not match header code', () => {
      expect(() =>
        openingBalanceEquityLedgerEntity.getCode('300000' as any)
      ).toThrow(AppError);
    });
  });

  describe('make', () => {
    const validPayload = {
      name: 'System Opening Balances',
      accountingEntityId: validUUID1,
      currency: validCurrency,
      createdBy: validUUID2,
    };

    it('should successfully create an opening balance equity account', () => {
      const [account, events] = openingBalanceEquityLedgerEntity.make(
        validPayload,
        '399000'
      );

      expect(account.code).toBe('399001');
      expect(account.type).toBe(ELedgerType.Equity);
      expect(account.normalBalance).toBe(ENormalBalance.Credit);
      expect(account.subType).toBe(EEquitySubType.OpeningBalance);
      expect(account.behavior).toBe(
        EEquityAccountBehavior.OpeningBalanceEquity
      );
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

      expect(account.name).toBe('System Opening Balances');
      expect(account.accountingEntityId).toBe(validUUID1);
      expect(account.createdBy).toBe(validUUID2);
      expect(account.currency).toEqual(validCurrency);
      expect(events).toHaveLength(1);
    });

    it('should throw if payload values are invalid', () => {
      const invalidPayload = { ...validPayload, name: 'A' };
      expect(() =>
        openingBalanceEquityLedgerEntity.make(invalidPayload, '399000')
      ).toThrow(AppError);
    });

    it('should use base code 399000 when predecessorCode is null', () => {
      const [account] = openingBalanceEquityLedgerEntity.make(
        validPayload,
        null
      );
      expect(account.code).toBe('399000');
    });
  });
});
