import { TEntityId } from '../../../../../shared/types/uuid';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import { AppError } from '../../../../../shared/value-objects/error';
import {
  EAssetAccountBehavior,
  EAssetSubType,
  IReceivablesAccount,
  IStatutoryReceivableAccount,
  ITradeReceivableAccount,
} from '../../../types/asset-account.types';
import { TReceivablesLedgerCode } from '../../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '../../../types/ledger.types';
import receivablesAccountEntity from '../02-receivables.entity';

describe('Receivables Entity', () => {
  const validUUID1 = generateUUID();
  const validUUID2 = generateUUID();
  const validUUID3 = generateUUID();

  const validCurrency = {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    minorUnit: 2n,
  };

  const validParent = {
    precedingCode: '102000' as TReceivablesLedgerCode,
    parentMaterializedPath: '102000' as TReceivablesLedgerCode,
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
    it('should generate the next sub-ledger code for receivables accounts', () => {
      expect(receivablesAccountEntity.getCode('102000')).toBe('102001');
      expect(receivablesAccountEntity.getCode('102099')).toBe('102100');
    });

    it('should return 102000 if predecessorCode is null', () => {
      expect(receivablesAccountEntity.getCode(null)).toBe('102000');
    });
  });

  describe('getMaterializedPath', () => {
    it('should return code if parentMaterializedPath is null', () => {
      expect(receivablesAccountEntity.getMaterializedPath('102000', null)).toBe(
        '102000'
      );
    });

    it('should return concatenated path if parentMaterializedPath is provided', () => {
      expect(
        receivablesAccountEntity.getMaterializedPath('102001', '102000')
      ).toBe('102000.102001');
    });
  });

  describe('make', () => {
    const validPayload: Pick<
      IReceivablesAccount,
      | 'name'
      | 'createdBy'
      | 'accountingEntityId'
      | 'currency'
      | 'isControlAccount'
      | 'controlAccountId'
      | 'behavior'
      | 'meta'
      | 'contraAccountRule'
      | 'adjunctAccountRule'
    > = {
      name: 'Receivables Control',
      accountingEntityId: validUUID1,
      currency: validCurrency,
      createdBy: validUUID2,
      isControlAccount: true,
      controlAccountId: null,
      behavior: EAssetAccountBehavior.TradeReceivable,
      contraAccountRule: EContraAccountRule.ContraPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
      meta: null,
    };

    it('should successfully create a general receivables account', () => {
      const [account, events] = receivablesAccountEntity.make(
        validPayload,
        validParent
      );

      expect(account.code).toBe('102001');
      expect(account.materializedPath).toBe('102000.102001');
      expect(account.type).toBe(ELedgerType.Asset);
      expect(account.normalBalance).toBe(ENormalBalance.Debit);
      expect(account.subType).toBe(EAssetSubType.Receivables);
      expect(account.behavior).toBe(EAssetAccountBehavior.TradeReceivable);
      expect(account.status).toBe(ELedgerAccountStatus.Active);
      expect(account.isControlAccount).toBe(true);
      expect(account.controlAccountId).toBeNull();
      expect(account.meta).toBeNull();
      expect(account.contraAccountRule).toBe(
        EContraAccountRule.ContraPermitted
      );
      expect(account.adjunctAccountRule).toBe(
        EAdjunctAccountRule.AdjunctPermitted
      );
      expect(events).toHaveLength(2);
    });

    it('should validate controlAccountId when provided', () => {
      const invalidPayload = {
        ...validPayload,
        isControlAccount: false,
        controlAccountId: 'invalid' as unknown as TEntityId,
      };
      expect(() =>
        receivablesAccountEntity.make(invalidPayload, validParent)
      ).toThrow(AppError);
    });

    it('should skip controlAccountId validation when null', () => {
      const [account] = receivablesAccountEntity.make(
        validPayload,
        validParent
      );
      expect(account.controlAccountId).toBeNull();
    });

    it('should use base code 102000 when predecessorCode is null', () => {
      const [account] = receivablesAccountEntity.make(validPayload, null);
      expect(account.code).toBe('102000');
      expect(account.materializedPath).toBe('102000');
    });
  });

  describe('makeStatutoryReceivableAccount', () => {
    const validStatutoryPayload: Pick<
      IStatutoryReceivableAccount,
      | 'name'
      | 'accountingEntityId'
      | 'currency'
      | 'createdBy'
      | 'isControlAccount'
      | 'controlAccountId'
    > = {
      name: 'VAT Receivable',
      accountingEntityId: validUUID1,
      isControlAccount: false,
      controlAccountId: validUUID3,
      currency: validCurrency,
      createdBy: validUUID2,
    };

    it('should successfully create a statutory receivable account', () => {
      const [account, events] =
        receivablesAccountEntity.makeStatutoryReceivableAccount(
          validStatutoryPayload,
          validParent
        );

      expect(account.code).toBe('102001');
      expect(account.materializedPath).toBe('102000.102001');
      expect(account.type).toBe(ELedgerType.Asset);
      expect(account.normalBalance).toBe(ENormalBalance.Debit);
      expect(account.subType).toBe(EAssetSubType.Receivables);
      expect(account.behavior).toBe(EAssetAccountBehavior.StatutoryReceivable);
      expect(account.status).toBe(ELedgerAccountStatus.Active);
      expect(account.contraAccountRule).toBe(
        EContraAccountRule.ContraNotPermitted
      );
      expect(account.adjunctAccountRule).toBe(
        EAdjunctAccountRule.AdjunctNotPermitted
      );
      expect(account.meta).toBeNull();
      expect(events).toHaveLength(2);
    });

    it('should throw if controlAccountId is invalid', () => {
      const invalidPayload = {
        ...validStatutoryPayload,
        controlAccountId: 'invalid' as unknown as TEntityId,
      };
      expect(() =>
        receivablesAccountEntity.makeStatutoryReceivableAccount(
          invalidPayload,
          validParent
        )
      ).toThrow(AppError);
    });
  });

  describe('makeTradeReceivableAccount', () => {
    const validTradePayload: Pick<
      ITradeReceivableAccount,
      | 'name'
      | 'accountingEntityId'
      | 'currency'
      | 'createdBy'
      | 'isControlAccount'
      | 'controlAccountId'
    > = {
      name: 'Trade Receivable - Client A',
      accountingEntityId: validUUID1,
      isControlAccount: false,
      controlAccountId: validUUID3,
      currency: validCurrency,
      createdBy: validUUID2,
    };

    it('should successfully create a trade receivable account', () => {
      const [account, events] =
        receivablesAccountEntity.makeTradeReceivableAccount(
          validTradePayload,
          validParent
        );

      expect(account.code).toBe('102001');
      expect(account.materializedPath).toBe('102000.102001');
      expect(account.type).toBe(ELedgerType.Asset);
      expect(account.normalBalance).toBe(ENormalBalance.Debit);
      expect(account.subType).toBe(EAssetSubType.Receivables);
      expect(account.behavior).toBe(EAssetAccountBehavior.TradeReceivable);
      expect(account.status).toBe(ELedgerAccountStatus.Active);
      expect(account.contraAccountRule).toBe(
        EContraAccountRule.ContraPermitted
      );
      expect(account.adjunctAccountRule).toBe(
        EAdjunctAccountRule.AdjunctPermitted
      );
      expect(account.meta).toBeNull();
      expect(events).toHaveLength(2);
    });

    it('should throw if controlAccountId is invalid', () => {
      const invalidPayload = {
        ...validTradePayload,
        controlAccountId: 'invalid' as unknown as TEntityId,
      };
      expect(() =>
        receivablesAccountEntity.makeTradeReceivableAccount(
          invalidPayload,
          validParent
        )
      ).toThrow(AppError);
    });
  });
});
