import { AppError } from '../../../../../shared/value-objects/error';
import { TCreationOmits } from '../../../../../shared/types/creation-omits.types';
import { TEntityId } from '../../../../../shared/types/uuid';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import shortTermLoanAccountEntity from '../00-short-term-loan.entity';
import {
  ELiabilityAccountBehavior,
  ELiabilitySubType,
  ICreditCardAccount,
  ICreditCardAccountMeta,
  IOverdraftAccount,
  IOverdraftAccountMeta,
  IShortTermDebtAccount,
  IShortTermLoanAccount,
  IShortTermLoanAccountMeta,
} from '../../../types/liability-account.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '../../../types/ledger.types';

describe('Short Term Loan Liability Entity', () => {
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
    it('should generate the next sub-ledger code for short term debt accounts', () => {
      expect(shortTermLoanAccountEntity.getCode('200000')).toBe('200001');
      expect(shortTermLoanAccountEntity.getCode('200099')).toBe('200100');
    });
  });

  describe('make', () => {
    const validPayload: Pick<
      IShortTermDebtAccount,
      | 'name'
      | 'createdBy'
      | 'accountingEntityId'
      | 'currency'
      | 'isControlAccount'
      | 'controlAccountId'
      | 'behavior'
      | 'meta'
    > = {
      name: 'Short Term Debts',
      accountingEntityId: validUUID1,
      currency: validCurrency,
      createdBy: validUUID2,
      isControlAccount: true,
      controlAccountId: null,
      behavior: ELiabilityAccountBehavior.ShortTermLoan,
      meta: null,
    };

    it('should successfully create a short term debt control account', () => {
      const [account, events] = shortTermLoanAccountEntity.make(
        validPayload,
        '200000'
      );

      expect(account.code).toBe('200001');
      expect(account.type).toBe(ELedgerType.Liability);
      expect(account.normalBalance).toBe(ENormalBalance.Credit);
      expect(account.subType).toBe(ELiabilitySubType.ShortTermDebt);
      expect(account.behavior).toBe(ELiabilityAccountBehavior.ShortTermLoan);
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
        shortTermLoanAccountEntity.make(invalidPayload as any, '200000')
      ).toThrow(AppError);
    });

    it('should skip controlAccountId validation when null', () => {
      const [account] = shortTermLoanAccountEntity.make(validPayload, '200000');
      expect(account.controlAccountId).toBeNull();
    });

    it('should use base code 200000 when predecessorCode is null', () => {
      const [account] = shortTermLoanAccountEntity.make(validPayload, null);
      expect(account.code).toBe('200000');
    });
  });

  describe('makeCreditCardAccountMeta', () => {
    const validMeta: ICreditCardAccountMeta = {
      cardIssuer: 'Test Bank',
      lastFourDigits: '1234',
      lastReconciliationDate: null,
    };

    it('should successfully create credit card account meta with all valid fields', () => {
      const meta =
        shortTermLoanAccountEntity.makeCreditCardAccountMeta(validMeta);
      expect(meta).toEqual(validMeta);
      expect(Object.isFrozen(meta)).toBe(true);
    });

    it('should throw AppError if cardIssuer is too short', () => {
      expect(() =>
        shortTermLoanAccountEntity.makeCreditCardAccountMeta({
          ...validMeta,
          cardIssuer: 'A',
        })
      ).toThrow(AppError);
    });

    it('should throw AppError if cardIssuer is too long', () => {
      expect(() =>
        shortTermLoanAccountEntity.makeCreditCardAccountMeta({
          ...validMeta,
          cardIssuer: 'A'.repeat(101),
        })
      ).toThrow(AppError);
    });

    it('should throw AppError if lastFourDigits is less than 4', () => {
      expect(() =>
        shortTermLoanAccountEntity.makeCreditCardAccountMeta({
          ...validMeta,
          lastFourDigits: '123',
        })
      ).toThrow(AppError);
    });

    it('should throw AppError if lastFourDigits is greater than 4', () => {
      expect(() =>
        shortTermLoanAccountEntity.makeCreditCardAccountMeta({
          ...validMeta,
          lastFourDigits: '12345',
        })
      ).toThrow(AppError);
    });
  });

  describe('makeCreditCardAccount', () => {
    const validMeta: ICreditCardAccountMeta = {
      cardIssuer: 'Test Bank',
      lastFourDigits: '1234',
      lastReconciliationDate: null,
    };

    const validPayload: TCreationOmits<ICreditCardAccount> = {
      name: 'Office Credit Card',
      accountingEntityId: validUUID1,
      isControlAccount: false,
      controlAccountId: validUUID3,
      currency: validCurrency,
      meta: validMeta,
      createdBy: validUUID2,
    } as TCreationOmits<ICreditCardAccount>;

    it('should successfully create a credit card account', () => {
      const [account, events] =
        shortTermLoanAccountEntity.makeCreditCardAccount(
          validPayload,
          '200000'
        );

      expect(account.code).toBe('200001');
      expect(account.type).toBe(ELedgerType.Liability);
      expect(account.normalBalance).toBe(ENormalBalance.Credit);
      expect(account.subType).toBe(ELiabilitySubType.ShortTermDebt);
      expect(account.behavior).toBe(ELiabilityAccountBehavior.CreditCard);
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
        shortTermLoanAccountEntity.makeCreditCardAccount(
          invalidPayload as any,
          '200000'
        )
      ).toThrow(AppError);
    });
  });

  describe('makeOverdraftAccountMeta', () => {
    const validMeta: IOverdraftAccountMeta = {
      linkedBankAccountId: validUUID1,
    };

    it('should successfully create overdraft account meta', () => {
      const meta =
        shortTermLoanAccountEntity.makeOverdraftAccountMeta(validMeta);
      expect(meta).toEqual(validMeta);
      expect(Object.isFrozen(meta)).toBe(true);
    });

    it('should throw AppError if linkedBankAccountId is invalid', () => {
      expect(() =>
        shortTermLoanAccountEntity.makeOverdraftAccountMeta({
          ...validMeta,
          linkedBankAccountId: 'invalid' as TEntityId,
        })
      ).toThrow(AppError);
    });
  });

  describe('makeOverdraftAccount', () => {
    const validMeta: IOverdraftAccountMeta = {
      linkedBankAccountId: validUUID1,
    };

    const validPayload: TCreationOmits<IOverdraftAccount> = {
      name: 'Main Overdraft',
      accountingEntityId: validUUID1,
      isControlAccount: false,
      controlAccountId: validUUID3,
      currency: validCurrency,
      meta: validMeta,
      createdBy: validUUID2,
    } as TCreationOmits<IOverdraftAccount>;

    it('should successfully create an overdraft account', () => {
      const [account, events] = shortTermLoanAccountEntity.makeOverdraftAccount(
        validPayload,
        '200000'
      );

      expect(account.code).toBe('200001');
      expect(account.type).toBe(ELedgerType.Liability);
      expect(account.normalBalance).toBe(ENormalBalance.Credit);
      expect(account.subType).toBe(ELiabilitySubType.ShortTermDebt);
      expect(account.behavior).toBe(ELiabilityAccountBehavior.Overdraft);
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
        shortTermLoanAccountEntity.makeOverdraftAccount(
          invalidPayload as any,
          '200000'
        )
      ).toThrow(AppError);
    });
  });

  describe('makeShortTermLoanAccountMeta', () => {
    const validDate = new Date('2026-12-31T00:00:00.000Z');
    const validMeta: IShortTermLoanAccountMeta = {
      lenderName: 'Peer Lender',
      maturityDate: validDate,
    };

    it('should successfully create short term loan meta', () => {
      const meta =
        shortTermLoanAccountEntity.makeShortTermLoanAccountMeta(validMeta);
      expect(meta).toEqual(validMeta);
      expect(Object.isFrozen(meta)).toBe(true);
    });

    it('should throw AppError if lenderName is too short', () => {
      expect(() =>
        shortTermLoanAccountEntity.makeShortTermLoanAccountMeta({
          ...validMeta,
          lenderName: 'A',
        })
      ).toThrow(AppError);
    });

    it('should throw AppError if lenderName is too long', () => {
      expect(() =>
        shortTermLoanAccountEntity.makeShortTermLoanAccountMeta({
          ...validMeta,
          lenderName: 'A'.repeat(101),
        })
      ).toThrow(AppError);
    });

    it('should successfully create short term loan meta with null maturity date', () => {
      const meta = shortTermLoanAccountEntity.makeShortTermLoanAccountMeta({
        lenderName: 'Peer Lender',
        maturityDate: null,
      });
      expect(meta).toEqual({
        lenderName: 'Peer Lender',
        maturityDate: null,
      });
    });
  });

  describe('makeShortTermLoanAccount', () => {
    const validMeta: IShortTermLoanAccountMeta = {
      lenderName: 'Peer Lender',
      maturityDate: new Date('2026-12-31T00:00:00.000Z'),
    };

    const validPayload: TCreationOmits<IShortTermLoanAccount> = {
      name: 'Payday Loan',
      accountingEntityId: validUUID1,
      isControlAccount: false,
      controlAccountId: validUUID3,
      currency: validCurrency,
      meta: validMeta,
      createdBy: validUUID2,
    } as TCreationOmits<IShortTermLoanAccount>;

    it('should successfully create a short term loan account', () => {
      const [account, events] =
        shortTermLoanAccountEntity.makeShortTermLoanAccount(
          validPayload,
          '200000'
        );

      expect(account.code).toBe('200001');
      expect(account.type).toBe(ELedgerType.Liability);
      expect(account.normalBalance).toBe(ENormalBalance.Credit);
      expect(account.subType).toBe(ELiabilitySubType.ShortTermDebt);
      expect(account.behavior).toBe(ELiabilityAccountBehavior.ShortTermLoan);
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
        shortTermLoanAccountEntity.makeShortTermLoanAccount(
          invalidPayload as any,
          '200000'
        )
      ).toThrow(AppError);
    });
  });
});
