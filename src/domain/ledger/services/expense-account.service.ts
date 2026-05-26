import { IEvent, TEntityWithEvents } from '../../../shared/types/event.types';
import currencyEntity from '../../currency/entities/currency.entity';
import { EXPENSE_LEDGER_CODES } from '../config/expense-codes.config';
import directCostsAccountEntity from '../entities/05-expense-account/00-direct-costs.entity';
import rentAndUtilitiesAccountEntity from '../entities/05-expense-account/02-rent-and-utilities.entity';
import bankChargeAccountEntity from '../entities/05-expense-account/07-bank-charge.entity';
import financeCostAccountEntity from '../entities/05-expense-account/08-finance-cost.entity';
import interestAccountEntity from '../entities/05-expense-account/09-interest.entity';
import taxExpenseAccountEntity from '../entities/05-expense-account/10-tax-expense.entity';
import unrealizedLossAccountEntity from '../entities/05-expense-account/11-unrealized-loss.entity';
import assetDisposalLossAccountEntity from '../entities/05-expense-account/12-asset-disposal-loss.entity';
import ILedgerAccountRepo from '../repos/ledger-account.repo';
import IExpenseAccountService from '../types/expense-account.service.types';
import {
  EExpenseAccountBehavior,
  IAssetDisposalLossAccount,
  IBankChargeAccount,
  IDirectCostsAccount,
  IExpenseLedgerAccount,
  IFinanceCostAccount,
  IIncomeTaxExpenseAccount,
  IInterestAccount,
  IRentUtilitiesAccount,
  IUnrealizedLossAccount,
} from '../types/expense-account.types';
import {
  TAssetDisposalLossLedgerCode,
  TBankChargeLedgerCode,
  TDirectCostsLedgerCode,
  TExpenseLedgerCode,
  TFinanceCostLedgerCode,
  TIncomeTaxLedgerCode,
  TInterestLedgerCode,
  TRentUtilitiesLedgerCode,
  TUnrealizedLossLedgerCode,
} from '../types/ledger-code.types';

type TBootstrapHeaders = IExpenseAccountService['bootstrapHeaderAccounts'];
type TBootstrapIndividualPostingAccounts =
  IExpenseAccountService['bootstrapIndividualPostingAccounts'];

export default function makeExpenseAccountService(
  repo: ILedgerAccountRepo
): IExpenseAccountService {
  /**
   * Bootstraps header expense accounts for a new accounting entity
   *  - Direct Costs:            500000
   *  - Rent and Utilities:      502000
   *  - Bank Charge:             507000
   *  - Finance Cost:            508000
   *  - Interest:                509000
   *  - Tax Expense:             510000
   *  - Unrealized Loss:         511000
   *  - Asset Disposal Loss:     512000
   */
  const bootstrapHeaderAccounts: TBootstrapHeaders = async (
    accountingEntity,
    repoOptions,
    shouldBootstrapPostingAccounts
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

    let directCostsHeader: IDirectCostsAccount;

    if (!existingDirectCosts) {
      const directCostsAccount = directCostsAccountEntity.makeHeader({
        ...basePayload,
        name: 'Direct Costs',
        behavior: EExpenseAccountBehavior.DefaultDirectCost,
      });
      directCostsHeader = directCostsAccount[0] as IDirectCostsAccount;
      allAccounts.push(directCostsAccount);
    } else {
      directCostsHeader = existingDirectCosts as IDirectCostsAccount;
    }

    /**
     * ==================== Rent and Utilities ====================
     */
    const rentAndUtilitiesCode = EXPENSE_LEDGER_CODES.RENT_AND_UTILITIES.HEADER;
    const existingRentAndUtilities =
      await getExistingAccounts(rentAndUtilitiesCode);

    let rentAndUtilitiesHeader: IRentUtilitiesAccount;

    if (!existingRentAndUtilities) {
      const rentAndUtilitiesAccount = rentAndUtilitiesAccountEntity.makeHeader({
        ...basePayload,
        name: 'Rent and Utilities',
      });
      rentAndUtilitiesHeader =
        rentAndUtilitiesAccount[0] as IRentUtilitiesAccount;
      allAccounts.push(rentAndUtilitiesAccount);
    } else {
      rentAndUtilitiesHeader =
        existingRentAndUtilities as IRentUtilitiesAccount;
    }

    /**
     * ==================== Bank Charge ====================
     */
    const bankChargeCode = EXPENSE_LEDGER_CODES.BANK_CHARGE.HEADER;
    const existingBankCharge = await getExistingAccounts(bankChargeCode);

    let bankChargeHeader: IBankChargeAccount;

    if (!existingBankCharge) {
      const bankChargeAccount = bankChargeAccountEntity.makeHeader({
        ...basePayload,
        name: 'Bank Charge',
      });
      bankChargeHeader = bankChargeAccount[0] as IBankChargeAccount;
      allAccounts.push(bankChargeAccount);
    } else {
      bankChargeHeader = existingBankCharge as IBankChargeAccount;
    }

    /**
     * ==================== Finance Cost ====================
     */
    const financeCostCode = EXPENSE_LEDGER_CODES.FINANCE_COST.HEADER;
    const existingFinanceCost = await getExistingAccounts(financeCostCode);

    let financeCostHeader: IFinanceCostAccount;

    if (!existingFinanceCost) {
      const financeCostAccount = financeCostAccountEntity.makeHeader({
        ...basePayload,
        name: 'Finance Cost',
      });
      financeCostHeader = financeCostAccount[0] as IFinanceCostAccount;
      allAccounts.push(financeCostAccount);
    } else {
      financeCostHeader = existingFinanceCost as IFinanceCostAccount;
    }

    /**
     * ==================== Interest ====================
     */
    const interestCode = EXPENSE_LEDGER_CODES.INTEREST.HEADER;
    const existingInterest = await getExistingAccounts(interestCode);

    let interestHeader: IInterestAccount;

    if (!existingInterest) {
      const interestAccount = interestAccountEntity.makeHeader({
        ...basePayload,
        name: 'Interest',
      });
      interestHeader = interestAccount[0] as IInterestAccount;
      allAccounts.push(interestAccount);
    } else {
      interestHeader = existingInterest as IInterestAccount;
    }

    /**
     * ==================== Tax Expense ====================
     */
    const taxExpenseCode = EXPENSE_LEDGER_CODES.TAX_EXPENSE.HEADER;
    const existingTaxExpense = await getExistingAccounts(taxExpenseCode);

    let taxExpenseHeader: IIncomeTaxExpenseAccount;

    if (!existingTaxExpense) {
      const taxExpenseAccount = taxExpenseAccountEntity.makeHeader({
        ...basePayload,
        name: 'Tax Expense',
      });
      taxExpenseHeader = taxExpenseAccount[0] as IIncomeTaxExpenseAccount;
      allAccounts.push(taxExpenseAccount);
    } else {
      taxExpenseHeader = existingTaxExpense as IIncomeTaxExpenseAccount;
    }

    /**
     * ==================== Unrealized Loss ====================
     */
    const unrealizedLossCode = EXPENSE_LEDGER_CODES.UNREALIZED_LOSS.HEADER;
    const existingUnrealizedLoss =
      await getExistingAccounts(unrealizedLossCode);

    let unrealizedLossHeader: IUnrealizedLossAccount;

    if (!existingUnrealizedLoss) {
      const unrealizedLossAccount = unrealizedLossAccountEntity.makeHeader({
        ...basePayload,
        name: 'Unrealized Loss',
      });
      unrealizedLossHeader = unrealizedLossAccount[0] as IUnrealizedLossAccount;
      allAccounts.push(unrealizedLossAccount);
    } else {
      unrealizedLossHeader = existingUnrealizedLoss as IUnrealizedLossAccount;
    }

    /**
     * ==================== Asset Disposal Loss ====================
     */
    const assetDisposalLossCode =
      EXPENSE_LEDGER_CODES.ASSET_DISPOSAL_LOSS.HEADER;
    const existingAssetDisposalLoss = await getExistingAccounts(
      assetDisposalLossCode
    );

    let assetDisposalLossHeader: IAssetDisposalLossAccount;

    if (!existingAssetDisposalLoss) {
      const assetDisposalLossAccount =
        assetDisposalLossAccountEntity.makeHeader({
          ...basePayload,
          name: 'Asset Disposal Loss',
        });
      assetDisposalLossHeader =
        assetDisposalLossAccount[0] as IAssetDisposalLossAccount;
      allAccounts.push(assetDisposalLossAccount);
    } else {
      assetDisposalLossHeader =
        existingAssetDisposalLoss as IAssetDisposalLossAccount;
    }

    if (shouldBootstrapPostingAccounts) {
      const postingAccountsWithEvents =
        await bootstrapIndividualPostingAccounts(
          accountingEntity,
          {
            directCostsHeader,
            rentAndUtilitiesHeader,
            bankChargeHeader,
            financeCostHeader,
            interestHeader,
            taxExpenseHeader,
            unrealizedLossHeader,
            assetDisposalLossHeader,
          },
          repoOptions
        );
      allAccounts.push(...postingAccountsWithEvents);
    }

    const accounts: IExpenseLedgerAccount[] = [];
    const events: IEvent<IExpenseLedgerAccount>[] = [];

    for (const [account, accountEvents] of allAccounts) {
      accounts.push(account);
      events.push(...accountEvents);
    }

    return { accounts, events };
  };

  /**
   * Sets up the following posting expense accounts for a non-power user:
   * - Direct Costs (Default)
   * - Rent and Utilities (Default)
   * - Bank Charge (Default)
   * - Finance Cost (Default)
   * - Interest (Default)
   * - Tax Expense (Default)
   * - Unrealized Loss (Default)
   * - Asset Disposal Loss (Default)
   */
  const bootstrapIndividualPostingAccounts: TBootstrapIndividualPostingAccounts =
    async (accountingEntity, headers, repoOptions) => {
      const {
        ownerId,
        id: accountingEntityId,
        functionalCurrencyCode,
      } = accountingEntity;

      const functionalCurrency = currencyEntity.getByCode(
        functionalCurrencyCode
      );

      const expenseAccounts: TEntityWithEvents<
        IExpenseLedgerAccount,
        IExpenseLedgerAccount
      >[] = [];

      /**
       * Direct Costs (Default)
       */
      const directCostsAccount = directCostsAccountEntity.make(
        {
          name: 'Direct Costs (Default)',
          createdBy: ownerId,
          accountingEntityId,
          currency: functionalCurrency,
          behavior: EExpenseAccountBehavior.DefaultDirectCost,
          isControlAccount: false,
          controlAccountId: headers.directCostsHeader.id,
          meta: null,
        },
        {
          precedingCode: headers.directCostsHeader
            .code as TDirectCostsLedgerCode,
          parentMaterializedPath: headers.directCostsHeader
            .materializedPath as TDirectCostsLedgerCode,
        }
      );
      expenseAccounts.push(directCostsAccount);

      /**
       * Rent and Utilities (Default)
       */
      const rentAccount = rentAndUtilitiesAccountEntity.make(
        {
          name: 'Rent and Utilities (Default)',
          createdBy: ownerId,
          accountingEntityId,
          currency: functionalCurrency,
          isControlAccount: false,
          controlAccountId: headers.rentAndUtilitiesHeader.id,
          meta: null,
        },
        {
          precedingCode: headers.rentAndUtilitiesHeader
            .code as TRentUtilitiesLedgerCode,
          parentMaterializedPath: headers.rentAndUtilitiesHeader
            .materializedPath as TRentUtilitiesLedgerCode,
        }
      );
      expenseAccounts.push(rentAccount);

      /**
       * Bank Charge (Default)
       */
      const bankChargeAccount = bankChargeAccountEntity.make(
        {
          name: 'Bank Charge (Default)',
          createdBy: ownerId,
          accountingEntityId,
          currency: functionalCurrency,
          isControlAccount: false,
          controlAccountId: headers.bankChargeHeader.id,
          meta: null,
        },
        {
          precedingCode: headers.bankChargeHeader.code as TBankChargeLedgerCode,
          parentMaterializedPath: headers.bankChargeHeader
            .materializedPath as TBankChargeLedgerCode,
        }
      );
      expenseAccounts.push(bankChargeAccount);

      /**
       * Finance Cost (Default)
       */
      const financeAccount = financeCostAccountEntity.make(
        {
          name: 'Finance Cost (Default)',
          createdBy: ownerId,
          accountingEntityId,
          currency: functionalCurrency,
          isControlAccount: false,
          controlAccountId: headers.financeCostHeader.id,
          meta: null,
        },
        {
          precedingCode: headers.financeCostHeader
            .code as TFinanceCostLedgerCode,
          parentMaterializedPath: headers.financeCostHeader
            .materializedPath as TFinanceCostLedgerCode,
        }
      );
      expenseAccounts.push(financeAccount);

      /**
       * Interest (Default)
       */
      const interestAccount = interestAccountEntity.make(
        {
          name: 'Interest (Default)',
          createdBy: ownerId,
          accountingEntityId,
          currency: functionalCurrency,
          isControlAccount: false,
          controlAccountId: headers.interestHeader.id,
          meta: null,
        },
        {
          precedingCode: headers.interestHeader.code as TInterestLedgerCode,
          parentMaterializedPath: headers.interestHeader
            .materializedPath as TInterestLedgerCode,
        }
      );
      expenseAccounts.push(interestAccount);

      /**
       * Tax Expense (Default)
       */
      const taxAccount = taxExpenseAccountEntity.make(
        {
          name: 'Tax Expense (Default)',
          createdBy: ownerId,
          accountingEntityId,
          currency: functionalCurrency,
          isControlAccount: false,
          controlAccountId: headers.taxExpenseHeader.id,
          meta: null,
        },
        {
          precedingCode: headers.taxExpenseHeader.code as TIncomeTaxLedgerCode,
          parentMaterializedPath: headers.taxExpenseHeader
            .materializedPath as TIncomeTaxLedgerCode,
        }
      );
      expenseAccounts.push(taxAccount);

      /**
       * Unrealized Loss (Default)
       */
      const unrealizedLossAccount = unrealizedLossAccountEntity.make(
        {
          name: 'Unrealized Loss (Default)',
          createdBy: ownerId,
          accountingEntityId,
          currency: functionalCurrency,
          isControlAccount: false,
          controlAccountId: headers.unrealizedLossHeader.id,
          meta: null,
        },
        {
          precedingCode: headers.unrealizedLossHeader
            .code as TUnrealizedLossLedgerCode,
          parentMaterializedPath: headers.unrealizedLossHeader
            .materializedPath as TUnrealizedLossLedgerCode,
        }
      );
      expenseAccounts.push(unrealizedLossAccount);

      /**
       * Asset Disposal Loss (Default)
       */
      const assetDisposalAccount = assetDisposalLossAccountEntity.make(
        {
          name: 'Asset Disposal Loss (Default)',
          createdBy: ownerId,
          accountingEntityId,
          currency: functionalCurrency,
          isControlAccount: false,
          controlAccountId: headers.assetDisposalLossHeader.id,
          meta: null,
        },
        {
          precedingCode: headers.assetDisposalLossHeader
            .code as TAssetDisposalLossLedgerCode,
          parentMaterializedPath: headers.assetDisposalLossHeader
            .materializedPath as TAssetDisposalLossLedgerCode,
        }
      );
      expenseAccounts.push(assetDisposalAccount);

      return expenseAccounts;
    };

  return Object.freeze({
    bootstrapHeaderAccounts,
    bootstrapIndividualPostingAccounts,
  });
}
