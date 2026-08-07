import { TEntityId } from '../../../../../shared/types/uuid';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import { TPayablesLedgerCode } from '../../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '../../../types/ledger.types';
import {
  ELiabilityAccountBehavior,
  ELiabilitySubType,
  IPayableAccount,
  IStatutoryPayableAccountMeta,
  ITradePayableAccountMeta,
} from '../../types/liability-account.types';
import payableAccountEntity from '../payables.entity';

describe('Payable Liability Entity', () => {
  const validUUID1 = generateUUID();
  const validUUID2 = generateUUID();
  const validUUID3 = generateUUID();
  const validUUID4 = generateUUID();

  const validCurrency: any = {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    minorUnit: 2,
  };

  const validParent = {
    precedingCode: '201000' as TPayablesLedgerCode,
    parentMaterializedPath: '201000' as TPayablesLedgerCode,
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

    it('should return 201000 if predecessorCode is null', () => {
      expect(payableAccountEntity.getCode(null)).toBe('201000');
    });
  });

  describe('getMaterializedPath', () => {
    it('should return code if parentMaterializedPath is null', () => {
      expect(payableAccountEntity.getMaterializedPath('201000', null)).toBe(
        '201000'
      );
    });

    it('should return concatenated path if parentMaterializedPath is provided', () => {
      expect(payableAccountEntity.getMaterializedPath('201001', '201000')).toBe(
        '201000.201001'
      );
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
        validParent
      );

      expect(account.code).toBe('201001');
      expect(account.materializedPath).toBe('201000.201001');
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
        payableAccountEntity.make(invalidPayload as any, validParent)
      ).toThrow();
    });

    it('should skip controlAccountId validation when null', () => {
      const [account] = payableAccountEntity.make(validPayload, validParent);
      expect(account.controlAccountId).toBeNull();
    });

    it('should use base code 201000 when predecessorCode is null', () => {
      const [account] = payableAccountEntity.make(validPayload, null);
      expect(account.code).toBe('201000');
      expect(account.materializedPath).toBe('201000');
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
      ).toThrow();
    });

    it('should throw AppError if taxAuthority is too long', () => {
      expect(() =>
        payableAccountEntity.makeStatutoryPayableAccountMeta({
          ...validMeta,
          taxAuthority: 'A'.repeat(101),
        })
      ).toThrow();
    });

    it('should throw AppError if taxType is too short', () => {
      expect(() =>
        payableAccountEntity.makeStatutoryPayableAccountMeta({
          ...validMeta,
          taxType: 'a',
        })
      ).toThrow();
    });
  });

  describe('makeStatutoryPayableAccount', () => {
    const validMeta: IStatutoryPayableAccountMeta = {
      taxAuthority: 'Federal Inland Revenue Service',
      taxType: 'personal_income_tax',
    };

    const validPayload: Parameters<
      typeof payableAccountEntity.makeStatutoryPayableAccount
    >[0] = {
      name: 'Personal Income Tax',
      accountingEntityId: validUUID1,

      isControlAccount: false,
      controlAccountId: validUUID3,
      currency: validCurrency,
      meta: validMeta,
      createdBy: validUUID2,
    };

    it('should successfully create a statutory payable account', () => {
      const [account, events] =
        payableAccountEntity.makeStatutoryPayableAccount(
          validPayload,
          validParent
        );

      expect(account.code).toBe('201001');
      expect(account.materializedPath).toBe('201000.201001');
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
          validParent
        )
      ).toThrow();
    });
  });

  describe('makeTradePayableAccountMeta', () => {
    const validMeta: ITradePayableAccountMeta = {
      counterpartyId: validUUID3,
      invoiceId: validUUID4,
    };

    it('should successfully create trade payable account meta with all valid fields', () => {
      const meta = payableAccountEntity.makeTradePayableAccountMeta(validMeta);
      expect(meta).toEqual(validMeta);
      expect(Object.isFrozen(meta)).toBe(true);
    });

    it('should throw AppError if counterpartyId is invalid', () => {
      expect(() =>
        payableAccountEntity.makeTradePayableAccountMeta({
          ...validMeta,
          counterpartyId: 'invalid' as TEntityId,
        })
      ).toThrow();
    });

    it('should throw AppError if invoiceId is invalid', () => {
      expect(() =>
        payableAccountEntity.makeTradePayableAccountMeta({
          ...validMeta,
          invoiceId: 'invalid' as TEntityId,
        })
      ).toThrow();
    });
  });

  describe('makeTradePayableAccount', () => {
    const validMeta: ITradePayableAccountMeta = {
      counterpartyId: validUUID3,
      invoiceId: validUUID4,
    };

    const validPayload: Parameters<
      typeof payableAccountEntity.makeTradePayableAccount
    >[0] = {
      name: 'Counterparty Invoice #001',
      accountingEntityId: validUUID1,

      isControlAccount: false,
      controlAccountId: validUUID3,
      currency: validCurrency,
      meta: validMeta,
      createdBy: validUUID2,
    };

    it('should successfully create a trade payable account', () => {
      const [account, events] = payableAccountEntity.makeTradePayableAccount(
        validPayload,
        validParent
      );

      expect(account.code).toBe('201001');
      expect(account.materializedPath).toBe('201000.201001');
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
          validParent
        )
      ).toThrow();
    });
  });
});
