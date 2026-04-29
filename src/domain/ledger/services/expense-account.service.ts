import { IEvent, TEntityWithEvents } from '../../../shared/types/event.types';
import currencyEntity from '../../currency/entities/currency.entity';
import { EXPENSE_LEDGER_CODES } from '../config/expense-codes.config';
import directCostsAccountEntity from '../entities/05-expense-account/00-direct-costs.entity';
import rentAndUtilitiesAccountEntity from '../entities/05-expense-account/02-rent-and-utilities.entity';
import financeCostsAccountEntity from '../entities/05-expense-account/07-finance-costs.entity';
import taxExpenseAccountEntity from '../entities/05-expense-account/08-tax-expense.entity';
import unrealizedLossAccountEntity from '../entities/05-expense-account/09-unrealized-loss.entity';
import assetDisposalLossAccountEntity from '../entities/05-expense-account/10-asset-disposal-loss.entity';
import ILedgerAccountRepo from '../repos/ledger-account.repo';
import IExpenseAccountService from '../types/expense-account.service.types';
import {
  EExpenseAccountBehavior,
  IExpenseLedgerAccount,
} from '../types/expense-account.types';
import { TExpenseLedgerCode } from '../types/ledger-code.types';

type TBootstrapHeaders = IExpenseAccountService['bootstrapHeaderAccounts'];

export default function makeExpenseAccountService(
  repo: ILedgerAccountRepo
): IExpenseAccountService {
  /**
   * Bootstraps header expense accounts for a new accounting entity
   *  - Direct Costs:            500000
   *  - Rent and Utilities:      502000
   *  - Finance Costs:           507000
   *  - Tax Expense:             508000
   *  - Unrealized Loss:         509000
   *  - Asset Disposal Loss:     510000
   */
  const bootstrapHeaderAccounts: TBootstrapHeaders = async (
    accountingEntity,
    repoOptions
  ) => {
    const accountingEntityId = accountingEntity.id;
    const functionalCurrency = currencyEntity.getByCode(
      accountingEntity.functionalCurrencyCode
    );
    const createdBy = accountingEntity.ownerId;

    const getExistingAccounts = async <T extends IExpenseLedgerAccount>(
      code: TExpenseLedgerCode
    ) => {
      return (await repo.findByCode(
        code,
        accountingEntityId,
        repoOptions
      )) as T | null;
    };

    const allAccounts: TEntityWithEvents<
      IExpenseLedgerAccount,
      IExpenseLedgerAccount
    >[] = [];

    const basePayload = {
      createdBy,
      accountingEntityId,
      currency: functionalCurrency,
    };

    /**
     * ==================== Direct Costs ====================
     */
    const directCostsCode = EXPENSE_LEDGER_CODES.DIRECT_COSTS.HEADER;
    const existingDirectCosts = await getExistingAccounts(directCostsCode);

    if (!existingDirectCosts) {
      const directCostsAccount = directCostsAccountEntity.makeHeader({
        ...basePayload,
        name: 'Direct Costs',
        behavior: EExpenseAccountBehavior.DefaultDirectCost,
      });
      allAccounts.push(directCostsAccount);
    }

    /**
     * ==================== Rent and Utilities ====================
     */
    const rentAndUtilitiesCode = EXPENSE_LEDGER_CODES.RENT_AND_UTILITIES.HEADER;
    const existingRentAndUtilities =
      await getExistingAccounts(rentAndUtilitiesCode);

    if (!existingRentAndUtilities) {
      const rentAndUtilitiesAccount = rentAndUtilitiesAccountEntity.makeHeader({
        ...basePayload,
        name: 'Rent and Utilities',
      });
      allAccounts.push(rentAndUtilitiesAccount);
    }

    /**
     * ==================== Finance Costs ====================
     */
    const financeCostsCode = EXPENSE_LEDGER_CODES.FINANCE_COSTS.HEADER;
    const existingFinanceCosts = await getExistingAccounts(financeCostsCode);

    if (!existingFinanceCosts) {
      const financeCostsAccount = financeCostsAccountEntity.makeHeader({
        ...basePayload,
        name: 'Finance Costs',
      });
      allAccounts.push(financeCostsAccount);
    }

    /**
     * ==================== Tax Expense ====================
     */
    const taxExpenseCode = EXPENSE_LEDGER_CODES.TAX_EXPENSE.HEADER;
    const existingTaxExpense = await getExistingAccounts(taxExpenseCode);

    if (!existingTaxExpense) {
      const taxExpenseAccount = taxExpenseAccountEntity.makeHeader({
        ...basePayload,
        name: 'Tax Expense',
      });
      allAccounts.push(taxExpenseAccount);
    }

    /**
     * ==================== Unrealized Loss ====================
     */
    const unrealizedLossCode = EXPENSE_LEDGER_CODES.UNREALIZED_LOSS.HEADER;
    const existingUnrealizedLoss =
      await getExistingAccounts(unrealizedLossCode);

    if (!existingUnrealizedLoss) {
      const unrealizedLossAccount = unrealizedLossAccountEntity.makeHeader({
        ...basePayload,
        name: 'Unrealized Loss',
      });
      allAccounts.push(unrealizedLossAccount);
    }

    /**
     * ==================== Asset Disposal Loss ====================
     */
    const assetDisposalLossCode =
      EXPENSE_LEDGER_CODES.ASSET_DISPOSAL_LOSS.HEADER;
    const existingAssetDisposalLoss = await getExistingAccounts(
      assetDisposalLossCode
    );

    if (!existingAssetDisposalLoss) {
      const assetDisposalLossAccount =
        assetDisposalLossAccountEntity.makeHeader({
          ...basePayload,
          name: 'Asset Disposal Loss',
        });
      allAccounts.push(assetDisposalLossAccount);
    }

    const accounts: IExpenseLedgerAccount[] = [];
    const events: IEvent<IExpenseLedgerAccount>[] = [];

    for (const [account, accountEvents] of allAccounts) {
      accounts.push(account);
      events.push(...accountEvents);
    }

    return { accounts, events };
  };

  return Object.freeze({
    bootstrapHeaderAccounts,
  });
}
