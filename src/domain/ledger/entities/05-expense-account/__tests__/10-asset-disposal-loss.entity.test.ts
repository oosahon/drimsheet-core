import { AppError } from '../../../../../shared/value-objects/error';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import assetDisposalLossAccountEntity from '../10-asset-disposal-loss.entity';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
  IAssetDisposalLossAccount,
} from '../../../types/expense-account.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '../../../types/ledger.types';

describe('Asset Disposal Loss Entity', () => {
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
    it('should generate the next sub-ledger code for asset disposal loss accounts', () => {
      expect(assetDisposalLossAccountEntity.getCode('510000')).toBe('510001');
      expect(assetDisposalLossAccountEntity.getCode('510099')).toBe('510100');
    });

    it('should throw if predecessor code does not match header code', () => {
      expect(() =>
        assetDisposalLossAccountEntity.getCode('511000' as any)
      ).toThrow(AppError);
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
      name: 'Loss on Disposal of Machinery',
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
        '510000'
      );

      expect(account.code).toBe('510001');
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
      expect(events).toHaveLength(1);
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
        '510000'
      );
      expect(account.isControlAccount).toBe(true);
      expect(account.controlAccountId).toBe(validUUID3);
      expect(events).toHaveLength(1);
    });

    it('should throw if payload values are invalid', () => {
      const invalidPayload = { ...validPayload, name: 'A' };
      expect(() =>
        assetDisposalLossAccountEntity.make(invalidPayload, '510000')
      ).toThrow(AppError);
    });

    it('should throw if controlAccountId is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        controlAccountId: 'invalid-uuid' as any,
      };
      expect(() =>
        assetDisposalLossAccountEntity.make(invalidPayload, '510000')
      ).toThrow(AppError);
    });

    it('should use base code 510000 when predecessorCode is null', () => {
      const [account] = assetDisposalLossAccountEntity.make(validPayload, null);
      expect(account.code).toBe('510000');
    });
  });
});
