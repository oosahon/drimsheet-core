import { AppError } from '../../../../../shared/value-objects/error';
import { TCreationOmits } from '../../../../../shared/types/creation-omits.types';
import { TEntityId } from '../../../../../shared/types/uuid';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import cashAndEquivalentAccountEntity from '../00-cash-and-equivalents.entity';
import {
  EAssetAccountBehavior,
  EAssetSubType,
  IBankAccount,
  IBankAccountMeta,
  ICashAndCashEquivalentAccount,
  IPettyCashAccount,
} from '../../../types/asset-account.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '../../../types/ledger.types';

describe('Cash and Cash Equivalent Entity', () => {
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
    it('should generate the next sub-ledger code for cash accounts', () => {
      expect(cashAndEquivalentAccountEntity.getCode('100000')).toBe('100001');
      expect(cashAndEquivalentAccountEntity.getCode('100099')).toBe('100100');
    });
  });

  describe('make', () => {
    const validPayload: Pick<
      ICashAndCashEquivalentAccount,
      | 'name'
      | 'createdBy'
      | 'accountingEntityId'
      | 'currency'
      | 'isControlAccount'
      | 'controlAccountId'
      | 'behavior'
      | 'meta'
    > = {
      name: 'Cash and Cash Equivalents',
      accountingEntityId: validUUID1,
      currency: validCurrency,
      createdBy: validUUID2,
      isControlAccount: true,
      controlAccountId: null,
      behavior: EAssetAccountBehavior.Bank,
      meta: null,
    };

    it('should successfully create a cash and cash equivalent control account', () => {
      const [account, events] = cashAndEquivalentAccountEntity.make(
        validPayload,
        '100000'
      );

      expect(account.code).toBe('100001');
      expect(account.type).toBe(ELedgerType.Asset);
      expect(account.normalBalance).toBe(ENormalBalance.Debit);
      expect(account.subType).toBe(EAssetSubType.CashAndCashEquivalent);
      expect(account.behavior).toBe(EAssetAccountBehavior.Bank);
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
        cashAndEquivalentAccountEntity.make(invalidPayload as any, '100000')
      ).toThrow(AppError);
    });

    it('should skip controlAccountId validation when null', () => {
      const [account] = cashAndEquivalentAccountEntity.make(
        validPayload,
        '100000'
      );
      expect(account.controlAccountId).toBeNull();
    });

    it('should use base code 100000 when predecessorCode is null', () => {
      const [account] = cashAndEquivalentAccountEntity.make(validPayload, null);
      expect(account.code).toBe('100000');
    });
  });

  describe('makeBankAccountMeta', () => {
    const validMeta: IBankAccountMeta = {
      bankName: 'Test Bank',
      accountNumber: '1234567890',
      accountName: 'Main Corporate Account',
      sortCode: '123456',
      swiftCode: 'TESTBANKXX',
      iban: 'GB12TEST123456789012',
      routingNumber: '123456789',
      branchCode: '12345',
      lastReconciliationDate: null,
    };

    it('should successfully create bank account meta with all valid fields', () => {
      const meta =
        cashAndEquivalentAccountEntity.makeBankAccountMeta(validMeta);
      expect(meta).toEqual(validMeta);
      expect(Object.isFrozen(meta)).toBe(true);
    });

    it('should successfully create bank account meta without optional fields', () => {
      const {
        sortCode,
        swiftCode,
        iban,
        routingNumber,
        branchCode,
        ...requiredMeta
      } = validMeta;
      const meta = cashAndEquivalentAccountEntity.makeBankAccountMeta(
        requiredMeta as any
      );
      expect(meta).toEqual({
        ...requiredMeta,
        sortCode: null,
        swiftCode: null,
        iban: null,
        routingNumber: null,
        branchCode: null,
        lastReconciliationDate: null,
      });
    });

    it('should throw AppError if bankName is too short', () => {
      expect(() =>
        cashAndEquivalentAccountEntity.makeBankAccountMeta({
          ...validMeta,
          bankName: 'A',
        })
      ).toThrow(AppError);
    });

    it('should throw AppError if accountNumber is invalid', () => {
      expect(() =>
        cashAndEquivalentAccountEntity.makeBankAccountMeta({
          ...validMeta,
          accountNumber: '12345',
        })
      ).toThrow(AppError); // < 6
    });

    it('should throw AppError if accountName is invalid', () => {
      expect(() =>
        cashAndEquivalentAccountEntity.makeBankAccountMeta({
          ...validMeta,
          accountName: 'N',
        })
      ).toThrow(AppError);
    });

    it('should throw AppError if sortCode is provided but invalid length', () => {
      expect(() =>
        cashAndEquivalentAccountEntity.makeBankAccountMeta({
          ...validMeta,
          sortCode: '12345',
        })
      ).toThrow(AppError);
    });

    it('should throw AppError if swiftCode is provided but invalid length', () => {
      expect(() =>
        cashAndEquivalentAccountEntity.makeBankAccountMeta({
          ...validMeta,
          swiftCode: 'TEST',
        })
      ).toThrow(AppError); // < 8
    });

    it('should throw AppError if iban is provided but invalid length', () => {
      expect(() =>
        cashAndEquivalentAccountEntity.makeBankAccountMeta({
          ...validMeta,
          iban: 'GB12TEST',
        })
      ).toThrow(AppError); // < 15
    });

    it('should throw AppError if routingNumber is provided but invalid length', () => {
      expect(() =>
        cashAndEquivalentAccountEntity.makeBankAccountMeta({
          ...validMeta,
          routingNumber: '12345',
        })
      ).toThrow(AppError); // != 9
    });

    it('should throw AppError if branchCode is provided but invalid length', () => {
      expect(() =>
        cashAndEquivalentAccountEntity.makeBankAccountMeta({
          ...validMeta,
          branchCode: '12345678901',
        })
      ).toThrow(AppError); // > 10
    });
  });

  describe('makePettyCashAccount', () => {
    const validPettyCashPayload: TCreationOmits<IPettyCashAccount> = {
      name: 'Main Office Petty Cash',
      accountingEntityId: validUUID1,
      isControlAccount: false,
      controlAccountId: validUUID3,
      currency: validCurrency,
      createdBy: validUUID2,
    } as TCreationOmits<IPettyCashAccount>;

    it('should successfully create a petty cash account', () => {
      const [account, events] =
        cashAndEquivalentAccountEntity.makePettyCashAccount(
          validPettyCashPayload,
          '100000'
        );

      expect(account.code).toBe('100001');
      expect(account.type).toBe(ELedgerType.Asset);
      expect(account.normalBalance).toBe(ENormalBalance.Debit);
      expect(account.subType).toBe(EAssetSubType.CashAndCashEquivalent);
      expect(account.behavior).toBe(EAssetAccountBehavior.PettyCash);
      expect(account.status).toBe(ELedgerAccountStatus.Active);
      expect(account.contraAccountRule).toBe(
        EContraAccountRule.ContraPermitted
      );
      expect(account.adjunctAccountRule).toBe(
        EAdjunctAccountRule.AdjunctPermitted
      );
      expect(account.meta).toEqual({ lastReconciliationDate: null });
      expect(Object.isFrozen(account.meta)).toBe(true);
      expect(events).toHaveLength(1);
    });

    it('should throw if controlAccountId is invalid', () => {
      const invalidPayload = {
        ...validPettyCashPayload,
        controlAccountId: 'invalid' as TEntityId,
      };
      expect(() =>
        cashAndEquivalentAccountEntity.makePettyCashAccount(
          invalidPayload as any,
          '100000'
        )
      ).toThrow(AppError);
    });
  });

  describe('makeBankAccount', () => {
    const validBankAccountMeta: IBankAccountMeta = {
      bankName: 'Test Bank',
      accountNumber: '1234567890',
      accountName: 'Main Corporate Account',
      sortCode: null,
      swiftCode: null,
      iban: null,
      routingNumber: null,
      branchCode: null,
      lastReconciliationDate: null,
    };

    const validBankPayload: TCreationOmits<IBankAccount> = {
      name: 'Operations Bank Account',
      accountingEntityId: validUUID1,
      isControlAccount: false,
      controlAccountId: validUUID3,
      currency: validCurrency,
      meta: validBankAccountMeta,
      createdBy: validUUID2,
    } as TCreationOmits<IBankAccount>;

    it('should successfully create a bank account', () => {
      const [account, events] = cashAndEquivalentAccountEntity.makeBankAccount(
        validBankPayload,
        '100000'
      );

      expect(account.code).toBe('100001');
      expect(account.type).toBe(ELedgerType.Asset);
      expect(account.normalBalance).toBe(ENormalBalance.Debit);
      expect(account.subType).toBe(EAssetSubType.CashAndCashEquivalent);
      expect(account.behavior).toBe(EAssetAccountBehavior.Bank);
      expect(account.status).toBe(ELedgerAccountStatus.Active);
      expect(account.contraAccountRule).toBe(
        EContraAccountRule.ContraPermitted
      );
      expect(account.adjunctAccountRule).toBe(
        EAdjunctAccountRule.AdjunctPermitted
      );
      expect(account.meta).toEqual(validBankAccountMeta);
      expect(events).toHaveLength(1);
    });

    it('should throw if controlAccountId is invalid', () => {
      const invalidPayload = {
        ...validBankPayload,
        controlAccountId: 'invalid' as TEntityId,
      };
      expect(() =>
        cashAndEquivalentAccountEntity.makeBankAccount(
          invalidPayload as any,
          '100000'
        )
      ).toThrow(AppError);
    });
  });
});
