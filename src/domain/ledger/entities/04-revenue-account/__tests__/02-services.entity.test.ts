import generateUUID from '../../../../../shared/utils/uuid-generator';
import { TServicesLedgerCode } from '../../../types/ledger-code.types';
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
import servicesAccountEntity from '../02-services.entity';

describe('Services Revenue Entity', () => {
  const validUUID1 = generateUUID();
  const validUUID2 = generateUUID();

  const validCurrency: any = {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    minorUnit: 2n,
  };

  const validParent = {
    precedingCode: '401000' as TServicesLedgerCode,
    parentMaterializedPath: '401000' as TServicesLedgerCode,
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
    it('should generate the next sub-ledger code for services accounts', () => {
      expect(servicesAccountEntity.getCode('401000')).toBe('401001');
      expect(servicesAccountEntity.getCode('401099')).toBe('401100');
    });

    it('should return 401000 if predecessorCode is null', () => {
      expect(servicesAccountEntity.getCode(null)).toBe('401000');
    });

    it('should throw if predecessor code does not match header code', () => {
      expect(() => servicesAccountEntity.getCode('400000' as any)).toThrow();
    });
  });

  describe('getMaterializedPath', () => {
    it('should return code if parentMaterializedPath is null', () => {
      expect(servicesAccountEntity.getMaterializedPath('401000', null)).toBe(
        '401000'
      );
    });

    it('should return concatenated path if parentMaterializedPath is provided', () => {
      expect(
        servicesAccountEntity.getMaterializedPath('401001', '401000')
      ).toBe('401000.401001');
    });
  });

  describe('make', () => {
    const validPayload = {
      name: 'Consulting Services',
      accountingEntityId: validUUID1,

      currency: validCurrency,
      createdBy: validUUID2,
      isControlAccount: false,
      controlAccountId: null,
      meta: null,
    };

    it('should successfully create a services account', () => {
      const [account, events] = servicesAccountEntity.make(
        validPayload,
        validParent
      );

      expect(account.code).toBe('401001');
      expect(account.materializedPath).toBe('401000.401001');
      expect(account.type).toBe(ELedgerType.Revenue);
      expect(account.normalBalance).toBe(ENormalBalance.Credit);
      expect(account.subType).toBe(ERevenueSubType.Services);
      expect(account.behavior).toBe(ERevenueAccountBehavior.Services);
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

      expect(account.name).toBe('Consulting Services');
      expect(account.accountingEntityId).toBe(validUUID1);
      expect(account.createdBy).toBe(validUUID2);
      expect(account.currency).toEqual(validCurrency);
      expect(events).toHaveLength(2);
    });

    it('should throw if payload values are invalid', () => {
      const invalidPayload = { ...validPayload, name: 'A' };
      expect(() =>
        servicesAccountEntity.make(invalidPayload, validParent)
      ).toThrow();
    });

    it('should use base code 401000 when predecessorCode is null', () => {
      const [account] = servicesAccountEntity.make(validPayload, null);
      expect(account.code).toBe('401000');
      expect(account.materializedPath).toBe('401000');
    });
  });
});
