import { IAccountingEntity } from '../../../../domain/accounting/types/accounting-entity.types';
import { EXPENSE_LEDGER_CODES } from '../../../../domain/ledger/config/expense-codes.config';
import ILedgerAccountRepo from '../../../../domain/ledger/repos/ledger-account.repo';
import { IAssetDisposalLossAccountService } from '../../../../domain/ledger/types/asset-disposal-loss.service.types';
import { IBankChargeAccountService } from '../../../../domain/ledger/types/bank-charge.service.types';
import { IDirectCostsAccountService } from '../../../../domain/ledger/types/direct-costs.service.types';
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
} from '../../../../domain/ledger/types/expense-account.types';
import { IFinanceCostAccountService } from '../../../../domain/ledger/types/finance-cost.service.types';
import { IInterestAccountService } from '../../../../domain/ledger/types/interest.service.types';
import { TExpenseLedgerCode } from '../../../../domain/ledger/types/ledger-code.types';
import { ILedgerAccount } from '../../../../domain/ledger/types/ledger.types';
import { IRentAndUtilitiesAccountService } from '../../../../domain/ledger/types/rent-and-utilities.service.types';
import { ITaxExpenseAccountService } from '../../../../domain/ledger/types/tax-expense.service.types';
import { IUnrealizedLossAccountService } from '../../../../domain/ledger/types/unrealized-loss.service.types';
import { IReadRepoOptions } from '../../../../shared/types/repo.types';
import {
  IEvent,
  TAuditedEntity,
} from '../../../../shared/values/events/types/event.types';
import { IEntityDelta } from '../../../../shared/values/history/types/history.types';

interface IDependencies {
  ledgerAccountRepo: ILedgerAccountRepo;
  directCostsAccountService: IDirectCostsAccountService;
  rentAndUtilitiesAccountService: IRentAndUtilitiesAccountService;
  bankChargeAccountService: IBankChargeAccountService;
  financeCostAccountService: IFinanceCostAccountService;
  interestAccountService: IInterestAccountService;
  taxExpenseAccountService: ITaxExpenseAccountService;
  unrealizedLossAccountService: IUnrealizedLossAccountService;
  assetDisposalLossAccountService: IAssetDisposalLossAccountService;
}

interface IExpenseAccountsBootstrapInput {
  accountingEntity: IAccountingEntity;
  repoOptions: IReadRepoOptions;
  shouldBootstrapPostingAccounts: boolean;
}

interface IExpensePostingAccountsBootstrapInput {
  accountingEntity: IAccountingEntity;
  repoOptions: IReadRepoOptions;
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
  const bootstrapPostingAccounts = async ({
    accountingEntity,
    repoOptions,
    headers,
  }: IExpensePostingAccountsBootstrapInput) => {
    const { ownerId: createdBy, id: accountingEntityId } = accountingEntity;
    const basePayload = {
      createdBy,
      accountingEntityId,
      isControlAccount: false,
    };

    const directCostsAccount =
      await deps.directCostsAccountService.createSubAccount(
        {
          ...basePayload,
          name: 'Direct Costs (Default)',
          behavior: EExpenseAccountBehavior.DefaultDirectCost,
          controlAccountCode: headers.directCostsHeader.code,
        },
        repoOptions
      );
    const rentAccount =
      await deps.rentAndUtilitiesAccountService.createSubAccount(
        {
          ...basePayload,
          name: 'Rent and Utilities (Default)',
          controlAccountCode: headers.rentAndUtilitiesHeader.code,
        },
        repoOptions
      );
    const bankChargeAccount =
      await deps.bankChargeAccountService.createSubAccount(
        {
          ...basePayload,
          name: 'Bank Charge (Default)',
          controlAccountCode: headers.bankChargeHeader.code,
        },
        repoOptions
      );
    const financeAccount =
      await deps.financeCostAccountService.createSubAccount(
        {
          ...basePayload,
          name: 'Finance Cost (Default)',
          controlAccountCode: headers.financeCostHeader.code,
        },
        repoOptions
      );
    const interestAccount = await deps.interestAccountService.createSubAccount(
      {
        ...basePayload,
        name: 'Interest (Default)',
        controlAccountCode: headers.interestHeader.code,
      },
      repoOptions
    );
    const taxAccount = await deps.taxExpenseAccountService.createSubAccount(
      {
        ...basePayload,
        name: 'Tax Expense (Default)',
        controlAccountCode: headers.taxExpenseHeader.code,
      },
      repoOptions
    );
    const unrealizedLossAccount =
      await deps.unrealizedLossAccountService.createSubAccount(
        {
          ...basePayload,
          name: 'Unrealized Loss (Default)',
          controlAccountCode: headers.unrealizedLossHeader.code,
        },
        repoOptions
      );
    const assetDisposalAccount =
      await deps.assetDisposalLossAccountService.createSubAccount(
        {
          ...basePayload,
          name: 'Asset Disposal Loss (Default)',
          controlAccountCode: headers.assetDisposalLossHeader.code,
        },
        repoOptions
      );

    return [
      directCostsAccount,
      rentAccount,
      bankChargeAccount,
      financeAccount,
      interestAccount,
      taxAccount,
      unrealizedLossAccount,
      assetDisposalAccount,
    ];
  };

  return async ({
    accountingEntity,
    repoOptions,
    shouldBootstrapPostingAccounts,
  }: IExpenseAccountsBootstrapInput) => {
    const accountingEntityId = accountingEntity.id;
    const createdBy = accountingEntity.ownerId;
    const getExistingAccount = async <T extends IExpenseLedgerAccount>(
      code: TExpenseLedgerCode
    ) =>
      (await deps.ledgerAccountRepo.findByCode(
        code,
        accountingEntityId,
        repoOptions
      )) as T | null;
    const allAccounts: TAuditedEntity<
      IExpenseLedgerAccount,
      IExpenseLedgerAccount,
      ILedgerAccount
    >[] = [];
    const headerPayload = { createdBy, accountingEntity };

    const existingDirectCosts = await getExistingAccount<IDirectCostsAccount>(
      EXPENSE_LEDGER_CODES.DIRECT_COSTS.HEADER
    );
    let directCostsHeader = existingDirectCosts;
    if (!directCostsHeader) {
      const account = await deps.directCostsAccountService.createHeader(
        {
          ...headerPayload,
          name: 'Direct Costs',
          behavior: EExpenseAccountBehavior.DefaultDirectCost,
        },
        repoOptions
      );
      directCostsHeader = account[0];
      allAccounts.push(account);
    }

    const existingRent = await getExistingAccount<IRentUtilitiesAccount>(
      EXPENSE_LEDGER_CODES.RENT_AND_UTILITIES.HEADER
    );
    let rentAndUtilitiesHeader = existingRent;
    if (!rentAndUtilitiesHeader) {
      const account = await deps.rentAndUtilitiesAccountService.createHeader(
        { ...headerPayload, name: 'Rent and Utilities' },
        repoOptions
      );
      rentAndUtilitiesHeader = account[0];
      allAccounts.push(account);
    }

    const existingBankCharge = await getExistingAccount<IBankChargeAccount>(
      EXPENSE_LEDGER_CODES.BANK_CHARGE.HEADER
    );
    let bankChargeHeader = existingBankCharge;
    if (!bankChargeHeader) {
      const account = await deps.bankChargeAccountService.createHeader(
        { ...headerPayload, name: 'Bank Charge' },
        repoOptions
      );
      bankChargeHeader = account[0];
      allAccounts.push(account);
    }

    const existingFinanceCost = await getExistingAccount<IFinanceCostAccount>(
      EXPENSE_LEDGER_CODES.FINANCE_COST.HEADER
    );
    let financeCostHeader = existingFinanceCost;
    if (!financeCostHeader) {
      const account = await deps.financeCostAccountService.createHeader(
        { ...headerPayload, name: 'Finance Cost' },
        repoOptions
      );
      financeCostHeader = account[0];
      allAccounts.push(account);
    }

    const existingInterest = await getExistingAccount<IInterestAccount>(
      EXPENSE_LEDGER_CODES.INTEREST.HEADER
    );
    let interestHeader = existingInterest;
    if (!interestHeader) {
      const account = await deps.interestAccountService.createHeader(
        { ...headerPayload, name: 'Interest' },
        repoOptions
      );
      interestHeader = account[0];
      allAccounts.push(account);
    }

    const existingTaxExpense =
      await getExistingAccount<IIncomeTaxExpenseAccount>(
        EXPENSE_LEDGER_CODES.TAX_EXPENSE.HEADER
      );
    let taxExpenseHeader = existingTaxExpense;
    if (!taxExpenseHeader) {
      const account = await deps.taxExpenseAccountService.createHeader(
        { ...headerPayload, name: 'Tax Expense' },
        repoOptions
      );
      taxExpenseHeader = account[0];
      allAccounts.push(account);
    }

    const existingUnrealizedLoss =
      await getExistingAccount<IUnrealizedLossAccount>(
        EXPENSE_LEDGER_CODES.UNREALIZED_LOSS.HEADER
      );
    let unrealizedLossHeader = existingUnrealizedLoss;
    if (!unrealizedLossHeader) {
      const account = await deps.unrealizedLossAccountService.createHeader(
        { ...headerPayload, name: 'Unrealized Loss' },
        repoOptions
      );
      unrealizedLossHeader = account[0];
      allAccounts.push(account);
    }

    const existingAssetDisposalLoss =
      await getExistingAccount<IAssetDisposalLossAccount>(
        EXPENSE_LEDGER_CODES.ASSET_DISPOSAL_LOSS.HEADER
      );
    let assetDisposalLossHeader = existingAssetDisposalLoss;
    if (!assetDisposalLossHeader) {
      const account = await deps.assetDisposalLossAccountService.createHeader(
        { ...headerPayload, name: 'Asset Disposal Loss' },
        repoOptions
      );
      assetDisposalLossHeader = account[0];
      allAccounts.push(account);
    }

    if (shouldBootstrapPostingAccounts) {
      const postingAccounts = await bootstrapPostingAccounts({
        accountingEntity,
        repoOptions,
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
