import { AppError } from '../../../../../shared/value-objects/error';
import { TCreationOmits } from '../../../../../shared/types/creation-omits.types';
import { TEntityId } from '../../../../../shared/types/uuid';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import payableAccountEntity from '../03-payables.entity';
import {
  ELiabilityAccountBehavior,
  ELiabilitySubType,
  IPayableAccount,
  IStatutoryPayableAccount,
  IStatutoryPayableAccountMeta,
  ITradePayableAccount,
  ITradePayableAccountMeta,
} from '../../../types/liability-account.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '../../../types/ledger.types';

describe('Payable Liability Entity', () => {
  const validUUID1 = generateUUID();
  const validUUID2 = generateUUID();
  const validUUID3 = generateUUID();
  const validUUID4 = generateUUID();

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
    it('should generate the next sub-ledger code for payable accounts', () => {
      expect(payableAccountEntity.getCode('201000')).toBe('201001');
      expect(payableAccountEntity.getCode('201099')).toBe('201100');
    });
  });

  describe('make', () => {
    const validPayload: Pick<
      IPayableAccount,
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
      name: 'Payables',
      accountingEntityId: validUUID1,
      currency: validCurrency,
      createdBy: validUUID2,
      isControlAccount: true,
      controlAccountId: null,
      behavior: ELiabilityAccountBehavior.Default,
      meta: null,
      contraAccountRule: EContraAccountRule.ContraPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
    };

    it('should successfully create a payable control account', () => {
      const [account, events] = payableAccountEntity.make(
        validPayload,
        '201000'
      );

      expect(account.code).toBe('201001');
      expect(account.type).toBe(ELedgerType.Liability);
      expect(account.normalBalance).toBe(ENormalBalance.Credit);
      expect(account.subType).toBe(ELiabilitySubType.Payable);
      expect(account.behavior).toBe(ELiabilityAccountBehavior.Default);
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
        payableAccountEntity.make(invalidPayload as any, '201000')
      ).toThrow(AppError);
    });

    it('should skip controlAccountId validation when null', () => {
      const [account] = payableAccountEntity.make(validPayload, '201000');
      expect(account.controlAccountId).toBeNull();
    });

    it('should use base code 201000 when predecessorCode is null', () => {
      const [account] = payableAccountEntity.make(validPayload, null);
      expect(account.code).toBe('201000');
    });
  });

  describe('makeStatutoryPayableAccountMeta', () => {
    const validMeta: IStatutoryPayableAccountMeta = {
      taxAuthority: 'Federal Inland Revenue Service',
      taxType: 'personal_income_tax',
    };

    it('should successfully create statutory payable account meta with all valid fields', () => {
      const meta =
        payableAccountEntity.makeStatutoryPayableAccountMeta(validMeta);
      expect(meta).toEqual(validMeta);
      expect(Object.isFrozen(meta)).toBe(true);
    });

    it('should throw AppError if taxAuthority is too short', () => {
      expect(() =>
        payableAccountEntity.makeStatutoryPayableAccountMeta({
          ...validMeta,
          taxAuthority: 'A',
        })
      ).toThrow(AppError);
    });

    it('should throw AppError if taxAuthority is too long', () => {
      expect(() =>
        payableAccountEntity.makeStatutoryPayableAccountMeta({
          ...validMeta,
          taxAuthority: 'A'.repeat(101),
        })
      ).toThrow(AppError);
    });

    it('should preserve the taxType value as-is', () => {
      const meta = payableAccountEntity.makeStatutoryPayableAccountMeta({
        ...validMeta,
        taxType: 'value_added_tax',
      });
      expect(meta.taxType).toBe('value_added_tax');
    });

    it('should throw AppError if taxType is invalid', () => {
      expect(() =>
        payableAccountEntity.makeStatutoryPayableAccountMeta({
          ...validMeta,
          taxType: 'invalid_tax_type' as any,
        })
      ).toThrow(AppError);
    });
  });

  describe('makeStatutoryPayableAccount', () => {
    const validMeta: IStatutoryPayableAccountMeta = {
      taxAuthority: 'Federal Inland Revenue Service',
      taxType: 'personal_income_tax',
    };

    const validPayload: TCreationOmits<IStatutoryPayableAccount> = {
      name: 'Personal Income Tax',
      accountingEntityId: validUUID1,
      isControlAccount: false,
      controlAccountId: validUUID3,
      currency: validCurrency,
      meta: validMeta,
      createdBy: validUUID2,
    } as TCreationOmits<IStatutoryPayableAccount>;

    it('should successfully create a statutory payable account', () => {
      const [account, events] =
        payableAccountEntity.makeStatutoryPayableAccount(
          validPayload,
          '201000'
        );

      expect(account.code).toBe('201001');
      expect(account.type).toBe(ELedgerType.Liability);
      expect(account.normalBalance).toBe(ENormalBalance.Credit);
      expect(account.subType).toBe(ELiabilitySubType.Payable);
      expect(account.behavior).toBe(ELiabilityAccountBehavior.TaxPayable);
      expect(account.status).toBe(ELedgerAccountStatus.Active);
      expect(account.contraAccountRule).toBe(
        EContraAccountRule.ContraNotPermitted
      );
      expect(account.adjunctAccountRule).toBe(
        EAdjunctAccountRule.AdjunctNotPermitted
      );
      expect(account.meta).toEqual(validMeta);
      expect(events).toHaveLength(1);
    });

    it('should throw if controlAccountId is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        controlAccountId: 'invalid' as TEntityId,
      };
      expect(() =>
        payableAccountEntity.makeStatutoryPayableAccount(
          invalidPayload as any,
          '201000'
        )
      ).toThrow(AppError);
    });
  });

  describe('makeTradePayableAccountMeta', () => {
    const validMeta: ITradePayableAccountMeta = {
      vendorId: validUUID3,
      invoiceId: validUUID4,
    };

    it('should successfully create trade payable account meta with all valid fields', () => {
      const meta = payableAccountEntity.makeTradePayableAccountMeta(validMeta);
      expect(meta).toEqual(validMeta);
      expect(Object.isFrozen(meta)).toBe(true);
    });

    it('should throw AppError if vendorId is invalid', () => {
      expect(() =>
        payableAccountEntity.makeTradePayableAccountMeta({
          ...validMeta,
          vendorId: 'invalid' as TEntityId,
        })
      ).toThrow(AppError);
    });

    it('should throw AppError if invoiceId is invalid', () => {
      expect(() =>
        payableAccountEntity.makeTradePayableAccountMeta({
          ...validMeta,
          invoiceId: 'invalid' as TEntityId,
        })
      ).toThrow(AppError);
    });
  });

  describe('makeTradePayableAccount', () => {
    const validMeta: ITradePayableAccountMeta = {
      vendorId: validUUID3,
      invoiceId: validUUID4,
    };

    const validPayload: TCreationOmits<ITradePayableAccount> = {
      name: 'Vendor Invoice #001',
      accountingEntityId: validUUID1,
      isControlAccount: false,
      controlAccountId: validUUID3,
      currency: validCurrency,
      meta: validMeta,
      createdBy: validUUID2,
    } as TCreationOmits<ITradePayableAccount>;

    it('should successfully create a trade payable account', () => {
      const [account, events] = payableAccountEntity.makeTradePayableAccount(
        validPayload,
        '201000'
      );

      expect(account.code).toBe('201001');
      expect(account.type).toBe(ELedgerType.Liability);
      expect(account.normalBalance).toBe(ENormalBalance.Credit);
      expect(account.subType).toBe(ELiabilitySubType.Payable);
      expect(account.behavior).toBe(ELiabilityAccountBehavior.TradePayable);
      expect(account.status).toBe(ELedgerAccountStatus.Active);
      expect(account.contraAccountRule).toBe(
        EContraAccountRule.ContraPermitted
      );
      expect(account.adjunctAccountRule).toBe(
        EAdjunctAccountRule.AdjunctPermitted
      );
      expect(account.meta).toEqual(validMeta);
      expect(events).toHaveLength(1);
    });

    it('should throw if controlAccountId is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        controlAccountId: 'invalid' as TEntityId,
      };
      expect(() =>
        payableAccountEntity.makeTradePayableAccount(
          invalidPayload as any,
          '201000'
        )
      ).toThrow(AppError);
    });
  });
});
