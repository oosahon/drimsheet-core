import { IRepoOptions } from '../../../app/contracts/infra/repo.contract';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import { IAccountingEntity } from '../../accounting-entity/types/accounting-entity.types';
import { EXPENSE_LEDGER_CODES } from '../config/expense-codes.config';
import directCostsAccountEntity from '../entities/05-expense-account/00-direct-costs.entity';
import rentAndUtilitiesAccountEntity from '../entities/05-expense-account/02-rent-and-utilities.entity';
import financeCostsAccountEntity from '../entities/05-expense-account/07-finance-costs.entity';
import taxExpenseAccountEntity from '../entities/05-expense-account/08-tax-expense.entity';
import unrealizedLossAccountEntity from '../entities/05-expense-account/09-unrealized-loss.entity';
import assetDisposalLossAccountEntity from '../entities/05-expense-account/10-asset-disposal-loss.entity';
import ILedgerAccountRepo from '../repos/ledger-account.repo';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
  IExpenseLedgerAccount,
} from '../types/expense-account.types';
import {
  TAssetDisposalLossLedgerCode,
  TDirectCostsLedgerCode,
  TIncomeTaxLedgerCode,
  TInterestFinanceLedgerCode,
  TRentUtilitiesLedgerCode,
  TUnrealizedLossLedgerCode,
} from '../types/ledger-code.types';
import { ELedgerType } from '../types/ledger.types';
import { canBootstrapPostingAccount } from './helpers/can-bootstrap-posting-account';

export interface IExpenseAccountService {
  bootstrapIndividualHeaderAccounts(
    accountingEntity: IAccountingEntity,
    repoOptions: IRepoOptions
  ): Promise<TEntityWithEvents<IExpenseLedgerAccount, IExpenseLedgerAccount>[]>;

  bootstrapIndividualPostingAccounts(
    accountingEntity: IAccountingEntity,
    repoOptions: IRepoOptions
  ): Promise<TEntityWithEvents<IExpenseLedgerAccount, IExpenseLedgerAccount>[]>;
}

export default function makeExpenseAccountBootstrapService(
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
    async bootstrapIndividualHeaderAccounts(accountingEntity, repoOptions) {
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
    async bootstrapIndividualPostingAccounts(accountingEntity, repoOptions) {
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
      const {
        canBootstrap: canBootstrapDirect,
        controlAccount: directControl,
      } = await canBootstrapPostingAccount(
        {
          accountingEntityId,
          type: ELedgerType.Expense,
          subType: EExpenseSubType.DirectCosts,
          controlLedgerCode: directCostsControlCode,
        },
        repo,
        repoOptions
      );

      if (canBootstrapDirect) {
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
          {
            precedingCode: directControl.code as TDirectCostsLedgerCode,
            parentMaterializedPath:
              directControl.materializedPath as TDirectCostsLedgerCode,
          }
        );
        expenseAccounts.push(account);
      }

      /**
       * Rent and Utilities (Default)
       */
      const rentControlCode = EXPENSE_LEDGER_CODES.RENT_AND_UTILITIES.HEADER;
      const { canBootstrap: canBootstrapRent, controlAccount: rentControl } =
        await canBootstrapPostingAccount(
          {
            accountingEntityId,
            type: ELedgerType.Expense,
            subType: EExpenseSubType.RentAndUtilities,
            controlLedgerCode: rentControlCode,
          },
          repo,
          repoOptions
        );

      if (canBootstrapRent) {
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
          {
            precedingCode: rentControl.code as TRentUtilitiesLedgerCode,
            parentMaterializedPath:
              rentControl.materializedPath as TRentUtilitiesLedgerCode,
          }
        );
        expenseAccounts.push(account);
      }

      /**
       * Finance Costs (Default)
       */
      const financeControlCode = EXPENSE_LEDGER_CODES.FINANCE_COSTS.HEADER;
      const {
        canBootstrap: canBootstrapFinance,
        controlAccount: financeControl,
      } = await canBootstrapPostingAccount(
        {
          accountingEntityId,
          type: ELedgerType.Expense,
          subType: EExpenseSubType.InterestAndFinanceCharges,
          controlLedgerCode: financeControlCode,
        },
        repo,
        repoOptions
      );

      if (canBootstrapFinance) {
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
          {
            precedingCode: financeControl.code as TInterestFinanceLedgerCode,
            parentMaterializedPath:
              financeControl.materializedPath as TInterestFinanceLedgerCode,
          }
        );
        expenseAccounts.push(account);
      }

      /**
       * Tax Expense (Default)
       */
      const taxControlCode = EXPENSE_LEDGER_CODES.TAX_EXPENSE.HEADER;
      const { canBootstrap: canBootstrapTax, controlAccount: taxControl } =
        await canBootstrapPostingAccount(
          {
            accountingEntityId,
            type: ELedgerType.Expense,
            subType: EExpenseSubType.IncomeTaxExpense,
            controlLedgerCode: taxControlCode,
          },
          repo,
          repoOptions
        );

      if (canBootstrapTax) {
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
          {
            precedingCode: taxControl.code as TIncomeTaxLedgerCode,
            parentMaterializedPath:
              taxControl.materializedPath as TIncomeTaxLedgerCode,
          }
        );
        expenseAccounts.push(account);
      }

      /**
       * Unrealized Loss (Default)
       */
      const unrealizedControlCode = EXPENSE_LEDGER_CODES.UNREALIZED_LOSS.HEADER;
      const {
        canBootstrap: canBootstrapUnrealized,
        controlAccount: unrealizedControl,
      } = await canBootstrapPostingAccount(
        {
          accountingEntityId,
          type: ELedgerType.Expense,
          subType: EExpenseSubType.UnrealizedLoss,
          controlLedgerCode: unrealizedControlCode,
        },
        repo,
        repoOptions
      );

      if (canBootstrapUnrealized) {
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
          {
            precedingCode: unrealizedControl.code as TUnrealizedLossLedgerCode,
            parentMaterializedPath:
              unrealizedControl.materializedPath as TUnrealizedLossLedgerCode,
          }
        );
        expenseAccounts.push(account);
      }

      /**
       * Asset Disposal Loss (Default)
       */
      const assetDisposalControlCode =
        EXPENSE_LEDGER_CODES.ASSET_DISPOSAL_LOSS.HEADER;
      const {
        canBootstrap: canBootstrapDisposal,
        controlAccount: disposalControl,
      } = await canBootstrapPostingAccount(
        {
          accountingEntityId,
          type: ELedgerType.Expense,
          subType: EExpenseSubType.LossOnAssetDisposal,
          controlLedgerCode: assetDisposalControlCode,
        },
        repo,
        repoOptions
      );

      if (canBootstrapDisposal) {
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
          {
            precedingCode: disposalControl.code as TAssetDisposalLossLedgerCode,
            parentMaterializedPath:
              disposalControl.materializedPath as TAssetDisposalLossLedgerCode,
          }
        );
        expenseAccounts.push(account);
      }

      return expenseAccounts;
    },
  };

  return Object.freeze(service);
}
