import generateUUID from '../../../../../shared/utils/uuid-generator';
import { AppError } from '../../../../../shared/value-objects/error';
import {
  EAssetAccountBehavior,
  EAssetSubType,
} from '../../../types/asset-account.types';
import { TAssetSuspenseLedgerCode } from '../../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '../../../types/ledger.types';
import assetSuspenseAccountEntity from '../99-suspense-account.entity';

describe('Asset Suspense Account Entity', () => {
  const validUUID1 = generateUUID();
  const validUUID2 = generateUUID();

  const validCurrency = {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    minorUnit: 2n,
  };

  const validParent = {
    precedingCode: '199000' as TAssetSuspenseLedgerCode,
    parentMaterializedPath: '199000' as TAssetSuspenseLedgerCode,
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
    it('should generate the next sub-ledger code for suspense accounts', () => {
      expect(assetSuspenseAccountEntity.getCode('199000')).toBe('199001');
      expect(assetSuspenseAccountEntity.getCode('199099')).toBe('199100');
    });

    it('should return 199000 if predecessorCode is null', () => {
      expect(assetSuspenseAccountEntity.getCode(null)).toBe('199000');
    });

    it('should throw if predecessor code does not match header code', () => {
      expect(() => assetSuspenseAccountEntity.getCode('100000' as any)).toThrow(
        AppError
      );
    });
  });

  describe('getMaterializedPath', () => {
    it('should return code if parentMaterializedPath is null', () => {
      expect(
        assetSuspenseAccountEntity.getMaterializedPath('199000', null)
      ).toBe('199000');
    });

    it('should return concatenated path if parentMaterializedPath is provided', () => {
      expect(
        assetSuspenseAccountEntity.getMaterializedPath('199001', '199000')
      ).toBe('199000.199001');
    });
  });

  describe('make', () => {
    const validSuspensePayload = {
      name: 'General Operational Suspense',
      accountingEntityId: validUUID1,
      currency: validCurrency,
      createdBy: validUUID2,
    };

    it('should successfully create a suspense account with all hardcoded restrictions', () => {
      const [account, events] = assetSuspenseAccountEntity.make(
        validSuspensePayload,
        validParent
      );

      expect(account.code).toBe('199001');
      expect(account.materializedPath).toBe('199000.199001');
      expect(account.type).toBe(ELedgerType.Asset);
      expect(account.normalBalance).toBe(ENormalBalance.Debit);
      expect(account.subType).toBe(EAssetSubType.Suspense);
      expect(account.behavior).toBe(EAssetAccountBehavior.Default);
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

      expect(account.name).toBe('General Operational Suspense');
      expect(account.accountingEntityId).toBe(validUUID1);
      expect(account.createdBy).toBe(validUUID2);
      expect(account.currency).toEqual(validCurrency);
      expect(events).toHaveLength(2);
    });

    it('should throw if the payload values are invalid', () => {
      const invalidPayload = { ...validSuspensePayload, name: 'A' }; // Too short
      expect(() =>
        assetSuspenseAccountEntity.make(invalidPayload, validParent)
      ).toThrow(AppError);

      const invalidPayload2 = {
        ...validSuspensePayload,
        accountingEntityId: 'invalid' as any,
      };
      expect(() =>
        assetSuspenseAccountEntity.make(invalidPayload2, validParent)
      ).toThrow(AppError);
    });
  });
});
