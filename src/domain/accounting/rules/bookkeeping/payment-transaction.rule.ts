import { EAssetAccountBehavior } from '../../../ledger/types/asset-account.types';
import { EExpenseSubType } from '../../../ledger/types/expense-account.types';
import { ILedgerAccount } from '../../../ledger/types/ledger.types';
import {
  ELiabilityAccountBehavior,
  ELiabilitySubType,
} from '../../../ledger/types/liability-account.types';
import accountingError from '../../errors/accounting.error';

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

  const unpermittedDestinations = destinations.filter(
    (acc) => !ALLOWED_DESTINATION_SUBTYPES.includes(acc.subType)
  );

  if (unpermittedDestinations.length > 0) {
    throw new accountingError.PaymentNotPermittedOnAccount({
      cause: {
        accounts: unpermittedDestinations.map(({ id, subType }) => ({
          id,
          subType,
        })),
      },
    });
  }
}

const paymentTransactionRule = Object.freeze({
  permittedSources: {
    behaviors: ALLOWED_SOURCE_BEHAVIORS,
  },
  permittedDestinations: {
    subtypes: ALLOWED_DESTINATION_SUBTYPES,
  },
  enforce: enforcer,
});

export default paymentTransactionRule;
