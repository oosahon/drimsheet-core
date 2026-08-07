import { IAccountingEntity } from '../../../../domain/accounting/types/accounting-entity.types';
import { EXPENSE_LEDGER_CODES } from '../../../../domain/ledger/config/expense-codes.config';
import assetDisposalLossAccountEntity from '../../../../domain/ledger/expense-account/entities/asset-disposal-loss.entity';
import bankChargeAccountEntity from '../../../../domain/ledger/expense-account/entities/bank-charge.entity';
import directCostsAccountEntity from '../../../../domain/ledger/expense-account/entities/direct-costs.entity';
import financeCostAccountEntity from '../../../../domain/ledger/expense-account/entities/finance-cost.entity';
import interestAccountEntity from '../../../../domain/ledger/expense-account/entities/interest.entity';
import rentAndUtilitiesAccountEntity from '../../../../domain/ledger/expense-account/entities/rent-and-utilities.entity';
import taxExpenseAccountEntity from '../../../../domain/ledger/expense-account/entities/tax-expense.entity';
import unrealizedLossAccountEntity from '../../../../domain/ledger/expense-account/entities/unrealized-loss.entity';
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
} from '../../../../domain/ledger/expense-account/types/expense-account.types';
import ILedgerAccountRepo from '../../../../domain/ledger/repos/ledger-account.repo';
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
} from '../../../../domain/ledger/types/ledger-code.types';
import { ILedgerAccount } from '../../../../domain/ledger/types/ledger.types';
import currencyEntity from '../../../../domain/money/entities/currency.entity';
import { IReadRepoOptions } from '../../../../shared/types/repo.types';
import {
  IEvent,
  TAuditedEntity,
} from '../../../../shared/values/events/types/event.types';
import { IEntityDelta } from '../../../../shared/values/history/types/history.types';

interface IDependencies {
  ledgerAccountRepo: ILedgerAccountRepo;
}

interface IExpenseAccountsBootstrapInput {
  accountingEntity: IAccountingEntity;
  repoOptions: IReadRepoOptions;
  shouldBootstrapPostingAccounts: boolean;
}

interface IExpensePostingAccountsBootstrapInput {
  accountingEntity: IAccountingEntity;
  headers: {
    directCostsHeader: IDirectCostsAccount;
    rentAndUtilitiesHeader: IRentUtilitiesAccount;
    bankChargeHeader: IBankChargeAccount;
    financeCostHeader: IFinanceCostAccount;
    interestHeader: IInterestAccount;
    taxExpenseHeader: IIncomeTaxExpenseAccount;
    unrealizedLossHeader: IUnrealizedLossAccount;
    assetDisposalLossHeader: IAssetDisposalLossAccount;
  };
}

export default function makeExpenseAccountsBootstrapHelper(
  deps: IDependencies
) {
  const bootstrapPostingAccounts = ({
    accountingEntity,
    headers,
  }: IExpensePostingAccountsBootstrapInput) => {
    const {
      ownerId,
      id: accountingEntityId,
      functionalCurrencyCode,
    } = accountingEntity;

    const functionalCurrency = currencyEntity.getByCode(functionalCurrencyCode);

    const expenseAccounts: TAuditedEntity<
      IExpenseLedgerAccount,
      IExpenseLedgerAccount,
      ILedgerAccount
    >[] = [];

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
        precedingCode: headers.directCostsHeader.code as TDirectCostsLedgerCode,
        parentMaterializedPath: headers.directCostsHeader
          .materializedPath as TDirectCostsLedgerCode,
      }
    );
    expenseAccounts.push(directCostsAccount);

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
        precedingCode: headers.financeCostHeader.code as TFinanceCostLedgerCode,
        parentMaterializedPath: headers.financeCostHeader
          .materializedPath as TFinanceCostLedgerCode,
      }
    );
    expenseAccounts.push(financeAccount);

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

  return async ({
    accountingEntity,
    repoOptions,
    shouldBootstrapPostingAccounts,
  }: IExpenseAccountsBootstrapInput) => {
    const accountingEntityId = accountingEntity.id;
    const functionalCurrency = currencyEntity.getByCode(
      accountingEntity.functionalCurrencyCode
    );
    const createdBy = accountingEntity.ownerId;

    const getExistingAccount = async <T extends IExpenseLedgerAccount>(
      code: TExpenseLedgerCode
    ) => {
      return (await deps.ledgerAccountRepo.findByCode(
        code,
        accountingEntityId,
        repoOptions
      )) as T | null;
    };

    const allAccounts: TAuditedEntity<
      IExpenseLedgerAccount,
      IExpenseLedgerAccount,
      ILedgerAccount
    >[] = [];

    const basePayload = {
      createdBy,
      accountingEntityId,
      currency: functionalCurrency,
    };

    const directCostsCode = EXPENSE_LEDGER_CODES.DIRECT_COSTS.HEADER;
    const existingDirectCosts = await getExistingAccount(directCostsCode);

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

    const rentAndUtilitiesCode = EXPENSE_LEDGER_CODES.RENT_AND_UTILITIES.HEADER;
    const existingRentAndUtilities =
      await getExistingAccount(rentAndUtilitiesCode);

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

    const bankChargeCode = EXPENSE_LEDGER_CODES.BANK_CHARGE.HEADER;
    const existingBankCharge = await getExistingAccount(bankChargeCode);

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

    const financeCostCode = EXPENSE_LEDGER_CODES.FINANCE_COST.HEADER;
    const existingFinanceCost = await getExistingAccount(financeCostCode);

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

    const interestCode = EXPENSE_LEDGER_CODES.INTEREST.HEADER;
    const existingInterest = await getExistingAccount(interestCode);

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

    const taxExpenseCode = EXPENSE_LEDGER_CODES.TAX_EXPENSE.HEADER;
    const existingTaxExpense = await getExistingAccount(taxExpenseCode);

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

    const unrealizedLossCode = EXPENSE_LEDGER_CODES.UNREALIZED_LOSS.HEADER;
    const existingUnrealizedLoss = await getExistingAccount(unrealizedLossCode);

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

    const assetDisposalLossCode =
      EXPENSE_LEDGER_CODES.ASSET_DISPOSAL_LOSS.HEADER;
    const existingAssetDisposalLoss = await getExistingAccount(
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
      const postingAccounts = bootstrapPostingAccounts({
        accountingEntity,
        headers: {
          directCostsHeader,
          rentAndUtilitiesHeader,
          bankChargeHeader,
          financeCostHeader,
          interestHeader,
          taxExpenseHeader,
          unrealizedLossHeader,
          assetDisposalLossHeader,
        },
      });
      allAccounts.push(...postingAccounts);
    }

    const accounts: IExpenseLedgerAccount[] = [];
    const events: IEvent<IExpenseLedgerAccount>[] = [];
    const audits: IEntityDelta<ILedgerAccount>[] = [];

    for (const [account, accountEvents, audit] of allAccounts) {
      accounts.push(account);
      events.push(...accountEvents);
      audits.push(audit);
    }

    return { accounts, events, audits };
  };
}
