import ILedgerAccountRepo from '../../../domain/ledger/repos/ledger-account.repo';
import ICashAccountService from '../../../domain/ledger/types/cash-account.service.types';
import { ILedgerAccount } from '../../../domain/ledger/types/ledger.types';
import { IPayablesAccountService } from '../../../domain/ledger/types/payables.service.types';
import { IReceivablesAccountService } from '../../../domain/ledger/types/receivables-account.service.types';
import { ISuspenseAccountService } from '../../../domain/ledger/types/suspense-account.service.types';
import IAccountsBootstrapService from '../contracts/accounts-bootstrap.service.contract';
import ledgerAppError from '../errors/ledger.error';
import makeAssetAccountsBootstrapHelper from './helpers/asset-accounts-bootstrap.helper';
import makeEquityAccountsBootstrapHelper from './helpers/equity-accounts-bootstrap.helper';
import makeExpenseAccountsBootstrapHelper from './helpers/expense-accounts-bootstrap.helper';
import makeLiabilityAccountsBootstrapHelper from './helpers/liability-accounts-bootstrap.helper';
import makeRevenueAccountsBootstrapHelper from './helpers/revenue-accounts-bootstrap.helper';

interface IDependencies {
  ledgerAccountRepo: ILedgerAccountRepo;
  cashAccountService: ICashAccountService;
  receivablesAccountService: IReceivablesAccountService;
  suspenseAccountService: ISuspenseAccountService;
  payablesAccountService: IPayablesAccountService;
}

type TBootstrap = IAccountsBootstrapService['bootstrap'];

export default function makeAccountsBootstrapService(
  deps: IDependencies
): IAccountsBootstrapService {
  const bootstrapAssetAccounts = makeAssetAccountsBootstrapHelper(deps);
  const ledgerAccountDependencies = {
    ledgerAccountRepo: deps.ledgerAccountRepo,
  };
  const bootstrapLiabilityAccounts = makeLiabilityAccountsBootstrapHelper({
    ...ledgerAccountDependencies,
    suspenseAccountService: deps.suspenseAccountService,
    payablesAccountService: deps.payablesAccountService,
  });
  const bootstrapEquityAccounts = makeEquityAccountsBootstrapHelper(
    ledgerAccountDependencies
  );
  const bootstrapRevenueAccounts = makeRevenueAccountsBootstrapHelper(
    ledgerAccountDependencies
  );
  const bootstrapExpenseAccounts = makeExpenseAccountsBootstrapHelper(
    ledgerAccountDependencies
  );

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
