import ILedgerAccountRepo from '@domain/ledger/repos/ledger-account.repo';
import { IAssetDisposalLossAccountService } from '@domain/ledger/types/asset-disposal-loss.service.types';
import { IBankChargeAccountService } from '@domain/ledger/types/bank-charge.service.types';
import ICashAccountService from '@domain/ledger/types/cash-account.service.types';
import { IDirectCostsAccountService } from '@domain/ledger/types/direct-costs.service.types';
import { IEmploymentIncomeAccountService } from '@domain/ledger/types/employment-income.service.types';
import { IEquityAccountService } from '@domain/ledger/types/equity-account.service.types';
import { IFinanceCostAccountService } from '@domain/ledger/types/finance-cost.service.types';
import { IGainOnAssetSaleAccountService } from '@domain/ledger/types/gain-on-sale.service.types';
import { IGiftsAccountService } from '@domain/ledger/types/gifts.service.types';
import { IGrantsAccountService } from '@domain/ledger/types/grants.service.types';
import { IInterestAccountService } from '@domain/ledger/types/interest.service.types';
import { ILedgerAccount } from '@domain/ledger/types/ledger.types';
import { IPayablesAccountService } from '@domain/ledger/types/payables.service.types';
import { IReceivablesAccountService } from '@domain/ledger/types/receivables-account.service.types';
import { IRentAndUtilitiesAccountService } from '@domain/ledger/types/rent-and-utilities.service.types';
import { IServicesAccountService } from '@domain/ledger/types/services.service.types';
import { IShortTermLoanAccountService } from '@domain/ledger/types/short-term-loan.service.types';
import { ISuspenseAccountService } from '@domain/ledger/types/suspense-account.service.types';
import { ITaxExpenseAccountService } from '@domain/ledger/types/tax-expense.service.types';
import { IUnrealizedGainAccountService } from '@domain/ledger/types/unrealized-gain.service.types';
import { IUnrealizedLossAccountService } from '@domain/ledger/types/unrealized-loss.service.types';

import IAccountsBootstrapService from '@app/ledger/contracts/accounts-bootstrap.service.contract';
import ledgerAppError from '@app/ledger/errors/ledger.error';
import makeAssetAccountsBootstrapHelper from '@app/ledger/services/helpers/asset-accounts-bootstrap.helper';
import makeEquityAccountsBootstrapHelper from '@app/ledger/services/helpers/equity-accounts-bootstrap.helper';
import makeExpenseAccountsBootstrapHelper from '@app/ledger/services/helpers/expense-accounts-bootstrap.helper';
import makeLiabilityAccountsBootstrapHelper from '@app/ledger/services/helpers/liability-accounts-bootstrap.helper';
import makeRevenueAccountsBootstrapHelper from '@app/ledger/services/helpers/revenue-accounts-bootstrap.helper';

interface IDependencies {
  ledgerAccountRepo: ILedgerAccountRepo;
  cashAccountService: ICashAccountService;
  receivablesAccountService: IReceivablesAccountService;
  suspenseAccountService: ISuspenseAccountService;
  payablesAccountService: IPayablesAccountService;
  shortTermLoanAccountService: IShortTermLoanAccountService;
  equityAccountService: IEquityAccountService;
  servicesAccountService: IServicesAccountService;
  employmentIncomeAccountService: IEmploymentIncomeAccountService;
  gainOnAssetSaleAccountService: IGainOnAssetSaleAccountService;
  unrealizedGainAccountService: IUnrealizedGainAccountService;
  grantsAccountService: IGrantsAccountService;
  giftsAccountService: IGiftsAccountService;
  directCostsAccountService: IDirectCostsAccountService;
  rentAndUtilitiesAccountService: IRentAndUtilitiesAccountService;
  bankChargeAccountService: IBankChargeAccountService;
  financeCostAccountService: IFinanceCostAccountService;
  interestAccountService: IInterestAccountService;
  taxExpenseAccountService: ITaxExpenseAccountService;
  unrealizedLossAccountService: IUnrealizedLossAccountService;
  assetDisposalLossAccountService: IAssetDisposalLossAccountService;
}

type TBootstrap = IAccountsBootstrapService['bootstrap'];

export default function makeAccountsBootstrapService(
  deps: IDependencies
): IAccountsBootstrapService {
  const bootstrapAssetAccounts = makeAssetAccountsBootstrapHelper({
    ledgerAccountRepo: deps.ledgerAccountRepo,
    cashAccountService: deps.cashAccountService,
    receivablesAccountService: deps.receivablesAccountService,
    suspenseAccountService: deps.suspenseAccountService,
  });
  const ledgerAccountDependencies = {
    ledgerAccountRepo: deps.ledgerAccountRepo,
  };
  const bootstrapLiabilityAccounts = makeLiabilityAccountsBootstrapHelper({
    ...ledgerAccountDependencies,
    suspenseAccountService: deps.suspenseAccountService,
    payablesAccountService: deps.payablesAccountService,
    shortTermLoanAccountService: deps.shortTermLoanAccountService,
  });
  const bootstrapEquityAccounts = makeEquityAccountsBootstrapHelper({
    ...ledgerAccountDependencies,
    equityAccountService: deps.equityAccountService,
  });
  const bootstrapRevenueAccounts = makeRevenueAccountsBootstrapHelper({
    ...ledgerAccountDependencies,
    servicesAccountService: deps.servicesAccountService,
    employmentIncomeAccountService: deps.employmentIncomeAccountService,
    gainOnAssetSaleAccountService: deps.gainOnAssetSaleAccountService,
    unrealizedGainAccountService: deps.unrealizedGainAccountService,
    grantsAccountService: deps.grantsAccountService,
    giftsAccountService: deps.giftsAccountService,
  });
  const bootstrapExpenseAccounts = makeExpenseAccountsBootstrapHelper({
    ...ledgerAccountDependencies,
    directCostsAccountService: deps.directCostsAccountService,
    rentAndUtilitiesAccountService: deps.rentAndUtilitiesAccountService,
    bankChargeAccountService: deps.bankChargeAccountService,
    financeCostAccountService: deps.financeCostAccountService,
    interestAccountService: deps.interestAccountService,
    taxExpenseAccountService: deps.taxExpenseAccountService,
    unrealizedLossAccountService: deps.unrealizedLossAccountService,
    assetDisposalLossAccountService: deps.assetDisposalLossAccountService,
  });

  const bootstrap: TBootstrap = async (
    accountingEntity,
    repoOptions,
    shouldBootstrapPostingAccounts
  ) => {
    const assetAccountsBootstrap = await bootstrapAssetAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts,
    });
    const liabilityAccountsBootstrap = await bootstrapLiabilityAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts,
    });
    const equityAccountsBootstrap = await bootstrapEquityAccounts({
      accountingEntity,
      repoOptions,
    });
    const revenueAccountsBootstrap = await bootstrapRevenueAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts,
    });
    const expenseAccountsBootstrap = await bootstrapExpenseAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts,
    });

    const accounts: ILedgerAccount[] = [
      ...assetAccountsBootstrap.accounts,
      ...liabilityAccountsBootstrap.accounts,
      ...equityAccountsBootstrap.accounts,
      ...revenueAccountsBootstrap.accounts,
      ...expenseAccountsBootstrap.accounts,
    ];
    const audits = [
      ...assetAccountsBootstrap.audits,
      ...liabilityAccountsBootstrap.audits,
      ...equityAccountsBootstrap.audits,
      ...revenueAccountsBootstrap.audits,
      ...expenseAccountsBootstrap.audits,
    ];
    const events = [
      ...assetAccountsBootstrap.events,
      ...liabilityAccountsBootstrap.events,
      ...equityAccountsBootstrap.events,
      ...revenueAccountsBootstrap.events,
      ...expenseAccountsBootstrap.events,
    ];
    const auditEntityIds = new Set(audits.map(({ entityId }) => entityId));

    if (
      auditEntityIds.size !== accounts.length ||
      audits.length !== accounts.length ||
      accounts.some(({ id }) => !auditEntityIds.has(id))
    ) {
      throw new ledgerAppError.InconsistentBootstrap({
        accountIds: accounts.map(({ id }) => id),
        auditEntityIds: audits.map(({ entityId }) => entityId),
      });
    }

    const auditsByEntityId = new Map(
      audits.map((audit) => [audit.entityId, audit])
    );
    const entries = accounts.map((account) => ({
      account,
      audit: auditsByEntityId.get(account.id)!,
    }));

    return Object.freeze({ entries, events });
  };

  return Object.freeze({ bootstrap });
}
