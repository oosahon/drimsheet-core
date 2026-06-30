import generateUUID from '../../../../../shared/utils/uuid-generator';
import { SYSTEM_CURRENCIES } from '../../../../currency/config/currencies.config';
import {
  EAssetAccountBehavior,
  EAssetSubType,
} from '../../../../ledger/asset-account/types/asset-account.types';
import { EExpenseSubType } from '../../../../ledger/expense-account/types/expense-account.types';
import {
  ELiabilityAccountBehavior,
  ELiabilitySubType,
} from '../../../../ledger/liability-account/types/liability-account.types';
import ledgerAccountEntity from '../../../../ledger/shared/entities/ledger-account.entity';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ILedgerAccount,
} from '../../../../ledger/shared/types/ledger.types';
import accountingError from '../../../errors/accounting.error';
import paymentTransactionRule from '../payment-transaction.rule';

function createMockAccount(overrides: Partial<ILedgerAccount>): ILedgerAccount {
  const type = overrides.type ?? ELedgerType.Asset;
  const subType = overrides.subType ?? EAssetSubType.CashAndCashEquivalent;
  const behavior = overrides.behavior ?? EAssetAccountBehavior.Bank;
  const code = overrides.code ?? '101001';

  const [account] = ledgerAccountEntity.make({
    code,
    materializedPath: code,
    accountingEntityId: overrides.accountingEntityId ?? generateUUID(),
    type,
    subType,
    behavior,
    normalBalance: ledgerAccountEntity.getNormalBalance(type),
    isControlAccount: false,
    controlAccountId: null,
    name: overrides.name ?? 'Test Account',
    currency: SYSTEM_CURRENCIES.USD,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: EContraAccountRule.ContraPermitted,
    adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
    meta: {},
    createdBy: generateUUID(),
    ...overrides,
  });
  return account;
}

describe('paymentTransactionRule', () => {
  describe('Rule Configuration', () => {
    it('should have correct permitted accounts configuration', () => {
      const permitted = paymentTransactionRule.getPermittedAccounts();
      expect(permitted.sources).toEqual({
        behaviors: [
          EAssetAccountBehavior.Bank,
          EAssetAccountBehavior.PettyCash,
          ELiabilityAccountBehavior.CreditCard,
        ],
        subtypes: [],
      });
      expect(permitted.destinations.subtypes).toContain(
        ELiabilitySubType.Payable
      );
      expect(permitted.destinations.subtypes).toContain(
        EExpenseSubType.DirectCosts
      );
    });

    it('should return credit for source and debit for destination', () => {
      const sides = paymentTransactionRule.getSides();
      expect(sides.source).toBe('credit');
      expect(sides.destination).toBe('debit');
    });
  });

  describe('enforce', () => {
    it('should pass when source has permitted behavior and destinations have permitted subtypes', () => {
      const source = createMockAccount({
        behavior: EAssetAccountBehavior.Bank,
        subType: EAssetSubType.CashAndCashEquivalent,
        type: ELedgerType.Asset,
        code: '101001',
      });
      const destination1 = createMockAccount({
        subType: ELiabilitySubType.Payable,
        type: ELedgerType.Liability,
        code: '201001',
      });
      const destination2 = createMockAccount({
        subType: EExpenseSubType.DirectCosts,
        type: ELedgerType.Expense,
        code: '501001',
      });

      expect(() => {
        paymentTransactionRule.enforce(source, [destination1, destination2]);
      }).not.toThrow();
    });

    it('should throw PaymentNotPermittedOnAccount when source behavior is not permitted', () => {
      const source = createMockAccount({
        behavior: ELiabilityAccountBehavior.Default,
        subType: ELiabilitySubType.Payable,
        type: ELedgerType.Liability,
        code: '201001',
      });
      const destination = createMockAccount({
        subType: EExpenseSubType.DirectCosts,
        type: ELedgerType.Expense,
        code: '501001',
      });

      expect(() => {
        paymentTransactionRule.enforce(source, [destination]);
      }).toThrow(accountingError.PaymentNotPermittedOnAccount);
    });

    it('should throw PaymentNotPermittedOnAccount when a destination subtype is not permitted', () => {
      const source = createMockAccount({
        behavior: EAssetAccountBehavior.Bank,
        subType: EAssetSubType.CashAndCashEquivalent,
        type: ELedgerType.Asset,
        code: '101001',
      });
      const destination = createMockAccount({
        behavior: EAssetAccountBehavior.Bank,
        subType: EAssetSubType.CashAndCashEquivalent,
        type: ELedgerType.Asset,
        code: '101002',
      });

      expect(() => {
        paymentTransactionRule.enforce(source, [destination]);
      }).toThrow(accountingError.PaymentNotPermittedOnAccount);
    });
  });
});
