// TODO: move to payment-entry service
import accountingError from '@domain/accounting/errors/accounting.error';
import { ITransactionRule } from '@domain/accounting/types/bookkeeping-rule.types';
import { EJournalSide } from '@domain/journal-entry/types/journal-line.types';
import { EAssetAccountBehavior } from '@domain/ledger/types/asset-account.types';
import { EExpenseSubType } from '@domain/ledger/types/expense-account.types';
import { ILedgerAccount } from '@domain/ledger/types/ledger.types';
import {
  ELiabilityAccountBehavior,
  ELiabilitySubType,
} from '@domain/ledger/types/liability-account.types';

const { Bank, PettyCash } = EAssetAccountBehavior;
const { CreditCard } = ELiabilityAccountBehavior;

const {
  ShortTermDebt,
  Payable,
  AccruedExpense,
  LongTermLoan,
  LeaseLiability,
  Suspense,
} = ELiabilitySubType;

const {
  DirectCosts,
  PayrollAndPersonnel,
  RentAndUtilities,
  AdminAndGeneral,
  MarketingAndSelling,
  ResearchAndDevelopment,
  BankCharge,
  FinanceCost,
  Interest,
} = EExpenseSubType;

const ALLOWED_SOURCE_BEHAVIORS: string[] = [Bank, PettyCash, CreditCard];

const ALLOWED_DESTINATION_SUBTYPES: string[] = [
  // liability
  ShortTermDebt,
  Payable,
  AccruedExpense,
  LongTermLoan,
  LeaseLiability,
  Suspense,

  // expenses
  DirectCosts,
  PayrollAndPersonnel,
  RentAndUtilities,
  AdminAndGeneral,
  MarketingAndSelling,
  ResearchAndDevelopment,
  BankCharge,
  FinanceCost,
  Interest,
];

function enforcer(source: ILedgerAccount, destinations: ILedgerAccount[]) {
  const isPermittedSource = ALLOWED_SOURCE_BEHAVIORS.includes(source.behavior);

  if (!isPermittedSource) {
    throw new accountingError.PaymentNotPermittedOnAccount({
      cause: { accountId: source.id, subType: source.behavior },
    });
  }

  const unPermittedDestinations = destinations.filter(
    (acc) => !ALLOWED_DESTINATION_SUBTYPES.includes(acc.subType)
  );

  if (unPermittedDestinations.length > 0) {
    throw new accountingError.PaymentNotPermittedOnAccount({
      cause: {
        accounts: unPermittedDestinations.map(({ id, subType }) => ({
          id,
          subType,
        })),
      },
    });
  }
}

const paymentTransactionRule: ITransactionRule = Object.freeze({
  enforce: enforcer,
  getPermittedAccounts() {
    return {
      sources: { behaviors: ALLOWED_SOURCE_BEHAVIORS, subtypes: [] },
      destinations: { behaviors: [], subtypes: ALLOWED_DESTINATION_SUBTYPES },
    };
  },
  getSides() {
    return {
      source: EJournalSide.Credit,
      destination: EJournalSide.Debit,
    };
  },
});

export default paymentTransactionRule;
