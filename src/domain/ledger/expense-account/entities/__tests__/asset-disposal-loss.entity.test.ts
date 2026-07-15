import generateUUID from '../../../../../shared/utils/uuid-generator';
import { TAssetDisposalLossLedgerCode } from '../../../shared/types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '../../../shared/types/ledger.types';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
  IAssetDisposalLossAccount,
} from '../../types/expense-account.types';
import assetDisposalLossAccountEntity from '../asset-disposal-loss.entity';

describe('Asset Disposal Loss Entity', () => {
  const validUUID1 = generateUUID();
  const validUUID2 = generateUUID();

  const validCurrency: any = {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    minorUnit: 2,
  };

  const validParent = {
    precedingCode: '512000' as TAssetDisposalLossLedgerCode,
    parentMaterializedPath: '512000' as TAssetDisposalLossLedgerCode,
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
    it('should generate the next sub-ledger code for asset disposal loss accounts', () => {
      expect(assetDisposalLossAccountEntity.getCode('512000')).toBe('512001');
      expect(assetDisposalLossAccountEntity.getCode('512099')).toBe('512100');
    });

    it('should return 512000 if predecessorCode is null', () => {
      expect(assetDisposalLossAccountEntity.getCode(null)).toBe('512000');
    });

    it('should throw if predecessor code does not match header code', () => {
      expect(() =>
        assetDisposalLossAccountEntity.getCode('513000' as any)
      ).toThrow();
    });
  });

  describe('getMaterializedPath', () => {
    it('should return code if parentMaterializedPath is null', () => {
      expect(
        assetDisposalLossAccountEntity.getMaterializedPath('512000', null)
      ).toBe('512000');
    });

    it('should return concatenated path if parentMaterializedPath is provided', () => {
      expect(
        assetDisposalLossAccountEntity.getMaterializedPath('512001', '512000')
      ).toBe('512000.512001');
    });
  });

  describe('make', () => {
    const validPayload: Pick<
      IAssetDisposalLossAccount,
      | 'name'
      | 'createdBy'
      | 'accountingEntityId'
      | 'currency'
      | 'isControlAccount'
      | 'controlAccountId'
      | 'meta'
    > = {
      name: 'Loss on Vehicle Sale',
      accountingEntityId: validUUID1,

      currency: validCurrency,
      createdBy: validUUID2,
      isControlAccount: false,
      controlAccountId: null,
      meta: null,
    };

    it('should successfully create an asset disposal loss account', () => {
      const [account, events] = assetDisposalLossAccountEntity.make(
        validPayload,
        validParent
      );

      expect(account.code).toBe('512001');
      expect(account.materializedPath).toBe('512000.512001');
      expect(account.type).toBe(ELedgerType.Expense);
      expect(account.normalBalance).toBe(ENormalBalance.Debit);
      expect(account.subType).toBe(EExpenseSubType.LossOnAssetDisposal);
      expect(account.behavior).toBe(EExpenseAccountBehavior.AssetDisposalLoss);
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

    it('should successfully create an asset disposal loss account with controlAccountId', () => {
      const validUUID3 = generateUUID();
      const payloadWithControl = {
        ...validPayload,
        isControlAccount: true,
        controlAccountId: validUUID3,
      };
      const [account, events] = assetDisposalLossAccountEntity.make(
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
        assetDisposalLossAccountEntity.make(invalidPayload, validParent)
      ).toThrow();
    });

    it('should use base code 512000 when predecessorCode is null', () => {
      const [account] = assetDisposalLossAccountEntity.make(validPayload, null);
      expect(account.code).toBe('512000');
      expect(account.materializedPath).toBe('512000');
    });
  });
});
