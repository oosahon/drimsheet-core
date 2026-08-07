import ILedgerAccountRepo from '../../../domain/ledger/shared/repos/ledger-account.repo';
import { ILedgerAccount } from '../../../domain/ledger/types/ledger.types';
import IAccountsBootstrapService from '../contracts/accounts-bootstrap.service.contract';
import ledgerAppError from '../errors/ledger.error';
import makeAssetAccountsBootstrapHelper from './helpers/asset-accounts-bootstrap.helper';
import makeEquityAccountsBootstrapHelper from './helpers/equity-accounts-bootstrap.helper';
import makeExpenseAccountsBootstrapHelper from './helpers/expense-accounts-bootstrap.helper';
import makeLiabilityAccountsBootstrapHelper from './helpers/liability-accounts-bootstrap.helper';
import makeRevenueAccountsBootstrapHelper from './helpers/revenue-accounts-bootstrap.helper';

interface IDependencies {
  ledgerAccountRepo: ILedgerAccountRepo;
}

type TBootstrap = IAccountsBootstrapService['bootstrap'];

export default function makeAccountsBootstrapService(
  deps: IDependencies
): IAccountsBootstrapService {
  const bootstrapAssetAccounts = makeAssetAccountsBootstrapHelper(deps);
  const bootstrapLiabilityAccounts = makeLiabilityAccountsBootstrapHelper(deps);
  const bootstrapEquityAccounts = makeEquityAccountsBootstrapHelper(deps);
  const bootstrapRevenueAccounts = makeRevenueAccountsBootstrapHelper(deps);
  const bootstrapExpenseAccounts = makeExpenseAccountsBootstrapHelper(deps);

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
