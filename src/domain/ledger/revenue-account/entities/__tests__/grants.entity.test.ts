import generateUUID from '../../../../../shared/utils/uuid-generator';
import { ICurrency } from '../../../../money/types/currency.types';
import { TGrantsLedgerCode } from '../../../types/ledger-code.types';
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
import grantsAccountEntity from '../grants.entity';

describe('Grants Revenue Entity', () => {
  const validUUID1 = generateUUID();
  const validUUID2 = generateUUID();

  const validCurrency: ICurrency = {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    minorUnit: 2,
  };

  const validParent = {
    precedingCode: '407000' as TGrantsLedgerCode,
    parentMaterializedPath: '407000' as TGrantsLedgerCode,
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
    it('should generate the next sub-ledger code for grants accounts', () => {
      expect(grantsAccountEntity.getCode('407000')).toBe('407001');
      expect(grantsAccountEntity.getCode('407099')).toBe('407100');
    });

    it('should return 407000 if predecessorCode is null', () => {
      expect(grantsAccountEntity.getCode(null)).toBe('407000');
    });

    it('should throw if predecessor code does not match header code', () => {
      expect(() =>
        grantsAccountEntity.getCode('400000' as TGrantsLedgerCode)
      ).toThrow();
    });
  });

  describe('getMaterializedPath', () => {
    it('should return code if parentMaterializedPath is null', () => {
      expect(grantsAccountEntity.getMaterializedPath('407000', null)).toBe(
        '407000'
      );
    });

    it('should return concatenated path if parentMaterializedPath is provided', () => {
      expect(grantsAccountEntity.getMaterializedPath('407001', '407000')).toBe(
        '407000.407001'
      );
    });
  });

  describe('make', () => {
    const validPayload = {
      name: 'Research Grant',
      accountingEntityId: validUUID1,

      currency: validCurrency,
      createdBy: validUUID2,
      isControlAccount: false,
      controlAccountId: null,
      meta: null,
    };

    it('should successfully create a grants account', () => {
      const [account, events] = grantsAccountEntity.make(
        validPayload,
        validParent
      );

      expect(account.code).toBe('407001');
      expect(account.materializedPath).toBe('407000.407001');
      expect(account.type).toBe(ELedgerType.Revenue);
      expect(account.normalBalance).toBe(ENormalBalance.Credit);
      expect(account.subType).toBe(ERevenueSubType.Grants);
      expect(account.behavior).toBe(ERevenueAccountBehavior.Grants);
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

      expect(account.name).toBe('Research Grant');
      expect(account.accountingEntityId).toBe(validUUID1);
      expect(account.createdBy).toBe(validUUID2);
      expect(account.currency).toEqual(validCurrency);
      expect(events).toHaveLength(2);
    });

    it('should throw if payload values are invalid', () => {
      const invalidPayload = { ...validPayload, name: 'A' };
      expect(() =>
        grantsAccountEntity.make(invalidPayload, validParent)
      ).toThrow();
    });

    it('should use base code 407000 when predecessorCode is null', () => {
      const [account] = grantsAccountEntity.make(validPayload, null);
      expect(account.code).toBe('407000');
      expect(account.materializedPath).toBe('407000');
    });
  });
});
