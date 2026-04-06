import { AppError } from '../../../../../shared/value-objects/error';
import { TCreationOmits } from '../../../../../shared/types/creation-omits.types';
import { TEntityId } from '../../../../../shared/types/uuid';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import receivablesAccountEntity from '../02-receivables.entity';
import {
  EAssetAccountBehavior,
  EAssetSubType,
  IReceivablesAccount,
  IStatutoryReceivableAccount,
  IStatutoryReceivableAccountMeta,
  ITradeReceivableAccount,
  ITradeReceivableAccountMeta,
} from '../../../types/asset-account.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '../../../types/ledger.types';
import { ETaxType } from '../../../types/tax.types';

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
        '102000'
      );

      expect(account.code).toBe('102001');
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
      expect(events).toHaveLength(1);
    });

    it('should validate controlAccountId when provided', () => {
      const invalidPayload = {
        ...validPayload,
        isControlAccount: false,
        controlAccountId: 'invalid' as TEntityId,
      };
      expect(() =>
        receivablesAccountEntity.make(invalidPayload as any, '102000')
      ).toThrow(AppError);
    });

    it('should skip controlAccountId validation when null', () => {
      const [account] = receivablesAccountEntity.make(validPayload, '102000');
      expect(account.controlAccountId).toBeNull();
    });

    it('should use base code 102000 when predecessorCode is null', () => {
      const [account] = receivablesAccountEntity.make(validPayload, null);
      expect(account.code).toBe('102000');
    });
  });

  describe('makeStatutoryReceivableAccountMeta', () => {
    const validMeta: IStatutoryReceivableAccountMeta = {
      taxAuthority: 'LIRS',
      taxType: ETaxType.ValueAddedTax,
    };

    it('should successfully create statutory receivable account meta', () => {
      const meta =
        receivablesAccountEntity.makeStatutoryReceivableAccountMeta(validMeta);
      expect(meta).toEqual(validMeta);
      expect(Object.isFrozen(meta)).toBe(true);
    });

    it('should throw AppError if taxAuthority is too short', () => {
      expect(() =>
        receivablesAccountEntity.makeStatutoryReceivableAccountMeta({
          ...validMeta,
          taxAuthority: 'A',
        })
      ).toThrow(AppError);
    });

    it('should throw AppError if taxAuthority is too long', () => {
      expect(() =>
        receivablesAccountEntity.makeStatutoryReceivableAccountMeta({
          ...validMeta,
          taxAuthority: 'A'.repeat(101),
        })
      ).toThrow(AppError);
    });

    it('should throw AppError if taxType is invalid', () => {
      expect(() =>
        receivablesAccountEntity.makeStatutoryReceivableAccountMeta({
          ...validMeta,
          taxType: 'invalid_tax_type' as any,
        })
      ).toThrow(AppError);
    });
  });

  describe('makeStatutoryReceivableAccount', () => {
    const validStatutoryPayload: TCreationOmits<IStatutoryReceivableAccount> = {
      name: 'VAT Receivable',
      accountingEntityId: validUUID1,
      isControlAccount: false,
      controlAccountId: validUUID3,
      currency: validCurrency,
      meta: {
        taxAuthority: 'FIRS',
        taxType: ETaxType.ValueAddedTax,
      },
      createdBy: validUUID2,
    } as TCreationOmits<IStatutoryReceivableAccount>;

    it('should successfully create a statutory receivable account', () => {
      const [account, events] =
        receivablesAccountEntity.makeStatutoryReceivableAccount(
          validStatutoryPayload,
          '102000'
        );

      expect(account.code).toBe('102001');
      expect(account.type).toBe(ELedgerType.Asset);
      expect(account.normalBalance).toBe(ENormalBalance.Debit);
      expect(account.subType).toBe(EAssetSubType.Receivables);
      expect(account.behavior).toBe(EAssetAccountBehavior.TaxReceivable);
      expect(account.status).toBe(ELedgerAccountStatus.Active);
      expect(account.contraAccountRule).toBe(
        EContraAccountRule.ContraNotPermitted
      );
      expect(account.adjunctAccountRule).toBe(
        EAdjunctAccountRule.AdjunctNotPermitted
      );
      expect(account.meta).toEqual(validStatutoryPayload.meta);
      expect(Object.isFrozen(account.meta)).toBe(true);
      expect(events).toHaveLength(1);
    });

    it('should throw if controlAccountId is invalid', () => {
      const invalidPayload = {
        ...validStatutoryPayload,
        controlAccountId: 'invalid' as TEntityId,
      };
      expect(() =>
        receivablesAccountEntity.makeStatutoryReceivableAccount(
          invalidPayload as any,
          '102000'
        )
      ).toThrow(AppError);
    });
  });

  describe('makeTradeReceivableAccountMeta', () => {
    const validTradeMeta: ITradeReceivableAccountMeta = {
      customerId: validUUID1,
      invoiceId: validUUID2,
    };

    it('should successfully create trade receivable account meta', () => {
      const meta =
        receivablesAccountEntity.makeTradeReceivableAccountMeta(validTradeMeta);
      expect(meta).toEqual(validTradeMeta);
      expect(Object.isFrozen(meta)).toBe(true);
    });

    it('should throw AppError if customerId is invalid', () => {
      expect(() =>
        receivablesAccountEntity.makeTradeReceivableAccountMeta({
          ...validTradeMeta,
          customerId: 'invalid_uuid' as any,
        })
      ).toThrow(AppError);
    });

    it('should throw AppError if invoiceId is invalid', () => {
      expect(() =>
        receivablesAccountEntity.makeTradeReceivableAccountMeta({
          ...validTradeMeta,
          invoiceId: 'invalid_uuid' as any,
        })
      ).toThrow(AppError);
    });
  });

  describe('makeTradeReceivableAccount', () => {
    const validTradePayload: TCreationOmits<ITradeReceivableAccount> = {
      name: 'Trade Receivable - Client A',
      accountingEntityId: validUUID1,
      isControlAccount: false,
      controlAccountId: validUUID3,
      currency: validCurrency,
      meta: {
        customerId: validUUID1,
        invoiceId: validUUID2,
      },
      createdBy: validUUID2,
    } as TCreationOmits<ITradeReceivableAccount>;

    it('should successfully create a trade receivable account', () => {
      const [account, events] =
        receivablesAccountEntity.makeTradeReceivableAccount(
          validTradePayload,
          '102000'
        );

      expect(account.code).toBe('102001');
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
      expect(account.meta).toEqual(validTradePayload.meta);
      expect(Object.isFrozen(account.meta)).toBe(true);
      expect(events).toHaveLength(1);
    });

    it('should throw if controlAccountId is invalid', () => {
      const invalidPayload = {
        ...validTradePayload,
        controlAccountId: 'invalid' as TEntityId,
      };
      expect(() =>
        receivablesAccountEntity.makeTradeReceivableAccount(
          invalidPayload as any,
          '102000'
        )
      ).toThrow(AppError);
    });
  });
});
