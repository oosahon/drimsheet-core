import { IRepoOptions } from '../../../app/contracts/infra/repo.contract';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import { IAccountingEntity } from '../../accounting-entity/types/accounting-entity.types';
import directCostsAccountEntity from '../entities/05-expense-account/00-direct-costs.entity';
import rentAndUtilitiesAccountEntity from '../entities/05-expense-account/02-rent-and-utilities.entity';
import financeCostsAccountEntity from '../entities/05-expense-account/07-finance-costs.entity';
import taxExpenseAccountEntity from '../entities/05-expense-account/08-tax-expense.entity';
import unrealizedLossAccountEntity from '../entities/05-expense-account/09-unrealized-loss.entity';
import assetDisposalLossAccountEntity from '../entities/05-expense-account/10-asset-disposal-loss.entity';
import ILedgerAccountRepo from '../repos/ledger-account.repo';
import { EXPENSE_LEDGER_CODES } from '../config/expense-codes.config';
import {
  IExpenseLedgerAccount,
  EExpenseSubType,
  EExpenseAccountBehavior,
} from '../types/expense-account.types';
import { ELedgerType } from '../types/ledger.types';
import { canMakePostingAccount } from './posting-account.utils';

export interface IExpenseAccountService {
  setupBaseIndividualAccounts(
    accountingEntity: IAccountingEntity,
    repoOptions: IRepoOptions
  ): Promise<TEntityWithEvents<IExpenseLedgerAccount, IExpenseLedgerAccount>[]>;

  bootstrapNonPowerUserAccounts(
    accountingEntity: IAccountingEntity,
    repoOptions: IRepoOptions
  ): Promise<TEntityWithEvents<IExpenseLedgerAccount, IExpenseLedgerAccount>[]>;
}

export default function expenseAccountService(
  repo: ILedgerAccountRepo
): IExpenseAccountService {
  const service: IExpenseAccountService = {
    /**
     * Sets up the following expense accounts for an individual:
     *  - Direct Costs:            500000
     *  - Rent and Utilities:      502000
     *  - Finance Costs:           507000
     *  - Tax Expense:             508000
     *  - Unrealized Loss:         509000
     *  - Asset Disposal Loss:     510000
     * @param accountingEntity: The individual entity account
     * @param repoOptions:      The repository options
     */
    async setupBaseIndividualAccounts(accountingEntity, repoOptions) {
      const {
        ownerId,
        id: accountingEntityId,
        functionalCurrency,
      } = accountingEntity;
      const expenseAccounts: TEntityWithEvents<
        IExpenseLedgerAccount,
        IExpenseLedgerAccount
      >[] = [];

      const directCostsCode = EXPENSE_LEDGER_CODES.DIRECT_COSTS.HEADER;
      const rentAndUtilitiesCode =
        EXPENSE_LEDGER_CODES.RENT_AND_UTILITIES.HEADER;
      const financeCostsCode = EXPENSE_LEDGER_CODES.FINANCE_COSTS.HEADER;
      const taxExpenseCode = EXPENSE_LEDGER_CODES.TAX_EXPENSE.HEADER;
      const unrealizedLossCode = EXPENSE_LEDGER_CODES.UNREALIZED_LOSS.HEADER;
      const assetDisposalLossCode =
        EXPENSE_LEDGER_CODES.ASSET_DISPOSAL_LOSS.HEADER;

      /**
       * Direct Costs
       */
      const existingDirectCosts = await repo.findByCode(
        directCostsCode,
        accountingEntityId,
        repoOptions
      );
      if (!existingDirectCosts) {
        const directCostsAccount = directCostsAccountEntity.make(
          {
            name: 'Direct Costs',
            createdBy: ownerId,
            accountingEntityId,
            currency: functionalCurrency,
            behavior: EExpenseAccountBehavior.DefaultDirectCost,
            isControlAccount: true,
            controlAccountId: null,
            meta: null,
          },
          null
        );
        expenseAccounts.push(directCostsAccount);
      }

      /**
       * Rent and Utilities
       */
      const existingRentAndUtilities = await repo.findByCode(
        rentAndUtilitiesCode,
        accountingEntityId,
        repoOptions
      );
      if (!existingRentAndUtilities) {
        const rentAndUtilitiesAccount = rentAndUtilitiesAccountEntity.make(
          {
            name: 'Rent and Utilities',
            createdBy: ownerId,
            accountingEntityId,
            currency: functionalCurrency,
            isControlAccount: true,
            controlAccountId: null,
            meta: null,
          },
          null
        );
        expenseAccounts.push(rentAndUtilitiesAccount);
      }

      /**
       * Finance Costs
       */
      const existingFinanceCosts = await repo.findByCode(
        financeCostsCode,
        accountingEntityId,
        repoOptions
      );
      if (!existingFinanceCosts) {
        const financeCostsAccount = financeCostsAccountEntity.make(
          {
            name: 'Finance Costs',
            createdBy: ownerId,
            accountingEntityId,
            currency: functionalCurrency,
            isControlAccount: true,
            controlAccountId: null,
            meta: null,
          },
          null
        );
        expenseAccounts.push(financeCostsAccount);
      }

      /**
       * Tax Expense
       */
      const existingTaxExpense = await repo.findByCode(
        taxExpenseCode,
        accountingEntityId,
        repoOptions
      );
      if (!existingTaxExpense) {
        const taxExpenseAccount = taxExpenseAccountEntity.make(
          {
            name: 'Tax Expense',
            createdBy: ownerId,
            accountingEntityId,
            currency: functionalCurrency,
            isControlAccount: true,
            controlAccountId: null,
            meta: null,
          },
          null
        );
        expenseAccounts.push(taxExpenseAccount);
      }

      /**
       * Unrealized Loss
       */
      const existingUnrealizedLoss = await repo.findByCode(
        unrealizedLossCode,
        accountingEntityId,
        repoOptions
      );
      if (!existingUnrealizedLoss) {
        const unrealizedLossAccount = unrealizedLossAccountEntity.make(
          {
            name: 'Unrealized Loss',
            createdBy: ownerId,
            accountingEntityId,
            currency: functionalCurrency,
            isControlAccount: true,
            controlAccountId: null,
            meta: null,
          },
          null
        );
        expenseAccounts.push(unrealizedLossAccount);
      }

      /**
       * Asset Disposal Loss
       */
      const existingAssetDisposalLoss = await repo.findByCode(
        assetDisposalLossCode,
        accountingEntityId,
        repoOptions
      );
      if (!existingAssetDisposalLoss) {
        const assetDisposalLossAccount = assetDisposalLossAccountEntity.make(
          {
            name: 'Asset Disposal Loss',
            createdBy: ownerId,
            accountingEntityId,
            currency: functionalCurrency,
            isControlAccount: true,
            controlAccountId: null,
            meta: null,
          },
          null
        );
        expenseAccounts.push(assetDisposalLossAccount);
      }

      return expenseAccounts;
    },

    /**
     * Sets up the following posting expense accounts for a non-power user:
     * - Direct Costs (Default)
     * - Rent and Utilities (Default)
     * - Finance Costs (Default)
     * - Tax Expense (Default)
     * - Unrealized Loss (Default)
     * - Asset Disposal Loss (Default)
     * @param accountingEntity: The individual entity account
     * @param repoOptions:      The repository options
     */
    async bootstrapNonPowerUserAccounts(accountingEntity, repoOptions) {
      const {
        ownerId,
        id: accountingEntityId,
        functionalCurrency,
      } = accountingEntity;
      const expenseAccounts: TEntityWithEvents<
        IExpenseLedgerAccount,
        IExpenseLedgerAccount
      >[] = [];

      /**
       * Direct Costs (Default)
       */
      const directCostsControlCode = EXPENSE_LEDGER_CODES.DIRECT_COSTS.HEADER;
      const { canMake: canMakeDirect, controlAccount: directControl } =
        await canMakePostingAccount(
          {
            accountingEntityId,
            type: ELedgerType.Expense,
            subType: EExpenseSubType.DirectCosts,
            controlLedgerCode: directCostsControlCode,
          },
          repo,
          repoOptions
        );

      if (canMakeDirect) {
        const account = directCostsAccountEntity.make(
          {
            name: 'Direct Costs (Default)',
            createdBy: ownerId,
            accountingEntityId,
            currency: functionalCurrency,
            behavior: EExpenseAccountBehavior.DefaultDirectCost,
            isControlAccount: false,
            controlAccountId: directControl.id,
            meta: null,
          },
          directCostsControlCode
        );
        expenseAccounts.push(account);
      }

      /**
       * Rent and Utilities (Default)
       */
      const rentControlCode = EXPENSE_LEDGER_CODES.RENT_AND_UTILITIES.HEADER;
      const { canMake: canMakeRent, controlAccount: rentControl } =
        await canMakePostingAccount(
          {
            accountingEntityId,
            type: ELedgerType.Expense,
            subType: EExpenseSubType.RentAndUtilities,
            controlLedgerCode: rentControlCode,
          },
          repo,
          repoOptions
        );

      if (canMakeRent) {
        const account = rentAndUtilitiesAccountEntity.make(
          {
            name: 'Rent and Utilities (Default)',
            createdBy: ownerId,
            accountingEntityId,
            currency: functionalCurrency,
            isControlAccount: false,
            controlAccountId: rentControl.id,
            meta: null,
          },
          rentControlCode
        );
        expenseAccounts.push(account);
      }

      /**
       * Finance Costs (Default)
       */
      const financeControlCode = EXPENSE_LEDGER_CODES.FINANCE_COSTS.HEADER;
      const { canMake: canMakeFinance, controlAccount: financeControl } =
        await canMakePostingAccount(
          {
            accountingEntityId,
            type: ELedgerType.Expense,
            subType: EExpenseSubType.InterestAndFinanceCharges,
            controlLedgerCode: financeControlCode,
          },
          repo,
          repoOptions
        );

      if (canMakeFinance) {
        const account = financeCostsAccountEntity.make(
          {
            name: 'Finance Costs (Default)',
            createdBy: ownerId,
            accountingEntityId,
            currency: functionalCurrency,
            isControlAccount: false,
            controlAccountId: financeControl.id,
            meta: null,
          },
          financeControlCode
        );
        expenseAccounts.push(account);
      }

      /**
       * Tax Expense (Default)
       */
      const taxControlCode = EXPENSE_LEDGER_CODES.TAX_EXPENSE.HEADER;
      const { canMake: canMakeTax, controlAccount: taxControl } =
        await canMakePostingAccount(
          {
            accountingEntityId,
            type: ELedgerType.Expense,
            subType: EExpenseSubType.IncomeTaxExpense,
            controlLedgerCode: taxControlCode,
          },
          repo,
          repoOptions
        );

      if (canMakeTax) {
        const account = taxExpenseAccountEntity.make(
          {
            name: 'Tax Expense (Default)',
            createdBy: ownerId,
            accountingEntityId,
            currency: functionalCurrency,
            isControlAccount: false,
            controlAccountId: taxControl.id,
            meta: null,
          },
          taxControlCode
        );
        expenseAccounts.push(account);
      }

      /**
       * Unrealized Loss (Default)
       */
      const unrealizedControlCode = EXPENSE_LEDGER_CODES.UNREALIZED_LOSS.HEADER;
      const { canMake: canMakeUnrealized, controlAccount: unrealizedControl } =
        await canMakePostingAccount(
          {
            accountingEntityId,
            type: ELedgerType.Expense,
            subType: EExpenseSubType.UnrealizedLoss,
            controlLedgerCode: unrealizedControlCode,
          },
          repo,
          repoOptions
        );

      if (canMakeUnrealized) {
        const account = unrealizedLossAccountEntity.make(
          {
            name: 'Unrealized Loss (Default)',
            createdBy: ownerId,
            accountingEntityId,
            currency: functionalCurrency,
            isControlAccount: false,
            controlAccountId: unrealizedControl.id,
            meta: null,
          },
          unrealizedControlCode
        );
        expenseAccounts.push(account);
      }

      /**
       * Asset Disposal Loss (Default)
       */
      const assetDisposalControlCode =
        EXPENSE_LEDGER_CODES.ASSET_DISPOSAL_LOSS.HEADER;
      const { canMake: canMakeDisposal, controlAccount: disposalControl } =
        await canMakePostingAccount(
          {
            accountingEntityId,
            type: ELedgerType.Expense,
            subType: EExpenseSubType.LossOnAssetDisposal,
            controlLedgerCode: assetDisposalControlCode,
          },
          repo,
          repoOptions
        );

      if (canMakeDisposal) {
        const account = assetDisposalLossAccountEntity.make(
          {
            name: 'Asset Disposal Loss (Default)',
            createdBy: ownerId,
            accountingEntityId,
            currency: functionalCurrency,
            isControlAccount: false,
            controlAccountId: disposalControl.id,
            meta: null,
          },
          assetDisposalControlCode
        );
        expenseAccounts.push(account);
      }

      return expenseAccounts;
    },
  };

  return Object.freeze(service);
}
