import { IJournalEntryRule } from '@domain/journal-entry/types/entry.rules.types';
import { EAssetAccountBehavior } from '@domain/ledger/types/asset-account.types';
import { EExpenseSubType } from '@domain/ledger/types/expense-account.types';
import {
  ELiabilityAccountBehavior,
  ELiabilitySubType,
} from '@domain/ledger/types/liability-account.types';

const paymentEntryRule: IJournalEntryRule = {
  source: {
    permittedTypes: '*',
    permittedSubTypes: '*',
    permittedBehaviors: new Set([
      EAssetAccountBehavior.Bank,
      EAssetAccountBehavior.PettyCash,
      ELiabilityAccountBehavior.CreditCard,
    ]),
  },
  destination: {
    permittedTypes: '*',
    permittedSubTypes: new Set([
      ELiabilitySubType.ShortTermDebt,
      ELiabilitySubType.Payable,
      ELiabilitySubType.AccruedExpense,
      ELiabilitySubType.LongTermLoan,
      ELiabilitySubType.LeaseLiability,
      ELiabilitySubType.Suspense,
      EExpenseSubType.DirectCosts,
      EExpenseSubType.PayrollAndPersonnel,
      EExpenseSubType.RentAndUtilities,
      EExpenseSubType.AdminAndGeneral,
      EExpenseSubType.MarketingAndSelling,
      EExpenseSubType.ResearchAndDevelopment,
      EExpenseSubType.BankCharge,
      EExpenseSubType.FinanceCost,
      EExpenseSubType.Interest,
    ]),
    permittedBehaviors: '*',
  },
};

export default paymentEntryRule;
