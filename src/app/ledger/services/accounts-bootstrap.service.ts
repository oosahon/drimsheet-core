import IAssetAccountService from '../../../domain/ledger/asset-account/types/asset-account.service.types';
import IEquityAccountService from '../../../domain/ledger/equity-account/types/equity-account.service.types';
import IExpenseAccountService from '../../../domain/ledger/expense-account/types/expense-account.service.types';
import ILiabilityAccountService from '../../../domain/ledger/liability-account/types/liability-account.service.types';
import IRevenueAccountService from '../../../domain/ledger/revenue-account/types/revenue-account.service.types';
import { ILedgerAccount } from '../../../domain/ledger/shared/types/ledger.types';
import IAccountsBootstrapService from '../contracts/accounts-bootstrap.service.contract';
import ledgerAppError from '../errors/ledger.error';

interface IDependencies {
  assetAccountService: IAssetAccountService;
  liabilityAccountService: ILiabilityAccountService;
  equityAccountService: IEquityAccountService;
  revenueAccountService: IRevenueAccountService;
  expenseAccountService: IExpenseAccountService;
}

type TBootstrap = IAccountsBootstrapService['bootstrap'];

export default function makeAccountsBootstrapService(
  deps: IDependencies
): IAccountsBootstrapService {
  const bootstrap: TBootstrap = async (
    accountingEntity,
    repoOptions,
    shouldBootstrapPostingAccounts
  ) => {
    const asset = await deps.assetAccountService.bootstrapHeaderAccounts(
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts
    );
    const liability =
      await deps.liabilityAccountService.bootstrapHeaderAccounts(
        accountingEntity,
        repoOptions,
        shouldBootstrapPostingAccounts
      );
    const equity = await deps.equityAccountService.bootstrapHeaderAccounts(
      accountingEntity,
      repoOptions
    );
    const revenue = await deps.revenueAccountService.bootstrapHeaderAccounts(
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts
    );
    const expense = await deps.expenseAccountService.bootstrapHeaderAccounts(
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts
    );

    const accounts: ILedgerAccount[] = [
      ...asset.accounts,
      ...liability.accounts,
      ...equity.accounts,
      ...revenue.accounts,
      ...expense.accounts,
    ];
    const audits = [
      ...asset.audits,
      ...liability.audits,
      ...equity.audits,
      ...revenue.audits,
      ...expense.audits,
    ];
    const events = [
      ...asset.events,
      ...liability.events,
      ...equity.events,
      ...revenue.events,
      ...expense.events,
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
