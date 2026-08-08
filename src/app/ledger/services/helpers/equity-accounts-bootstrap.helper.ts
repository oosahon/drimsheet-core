import { IAccountingEntity } from '../../../../domain/accounting/types/accounting-entity.types';
import { EQUITY_LEDGER_CODES } from '../../../../domain/ledger/config/equity-codes.config';
import ILedgerAccountRepo from '../../../../domain/ledger/repos/ledger-account.repo';
import { IEquityAccountService } from '../../../../domain/ledger/types/equity-account.service.types';
import { IEquityLedgerAccount } from '../../../../domain/ledger/types/equity-account.types';
import { TEquityLedgerCode } from '../../../../domain/ledger/types/ledger-code.types';
import { ILedgerAccount } from '../../../../domain/ledger/types/ledger.types';
import { IReadRepoOptions } from '../../../../shared/types/repo.types';
import {
  IEvent,
  TAuditedEntity,
} from '../../../../shared/values/events/types/event.types';
import { IEntityDelta } from '../../../../shared/values/history/types/history.types';

interface IDependencies {
  ledgerAccountRepo: ILedgerAccountRepo;
  equityAccountService: IEquityAccountService;
}

interface IEquityAccountsBootstrapInput {
  accountingEntity: IAccountingEntity;
  repoOptions: IReadRepoOptions;
}

export default function makeEquityAccountsBootstrapHelper(deps: IDependencies) {
  return async ({
    accountingEntity,
    repoOptions,
  }: IEquityAccountsBootstrapInput) => {
    const accountingEntityId = accountingEntity.id;
    const createdBy = accountingEntity.ownerId;

    const getExistingAccount = async <T extends IEquityLedgerAccount>(
      code: TEquityLedgerCode
    ) => {
      return (await deps.ledgerAccountRepo.findByCode(
        code,
        accountingEntityId,
        repoOptions
      )) as T | null;
    };

    const allAccounts: TAuditedEntity<
      IEquityLedgerAccount,
      IEquityLedgerAccount,
      ILedgerAccount
    >[] = [];

    const retainedEarningsCode = EQUITY_LEDGER_CODES.RETAINED_EARNINGS;
    const existingRetainedEarnings =
      await getExistingAccount(retainedEarningsCode);

    if (!existingRetainedEarnings) {
      const retainedEarningsAccount =
        await deps.equityAccountService.createRetainedEarningsAccount(
          {
            name: 'Retained Earnings',
            createdBy,
            accountingEntity,
          },
          repoOptions
        );
      allAccounts.push(retainedEarningsAccount);
    }

    const openingBalanceEquityCode = EQUITY_LEDGER_CODES.OPENING_BALANCE_EQUITY;
    const existingOpeningBalanceEquity = await getExistingAccount(
      openingBalanceEquityCode
    );

    if (!existingOpeningBalanceEquity) {
      const openingBalanceEquityAccount =
        await deps.equityAccountService.createOpeningBalanceAccount(
          {
            name: 'Opening Balance Equity',
            createdBy,
            accountingEntity,
          },
          repoOptions
        );
      allAccounts.push(openingBalanceEquityAccount);
    }

    const accounts: IEquityLedgerAccount[] = [];
    const events: IEvent<IEquityLedgerAccount>[] = [];
    const audits: IEntityDelta<ILedgerAccount>[] = [];

    for (const [account, accountEvents, audit] of allAccounts) {
      accounts.push(account);
      events.push(...accountEvents);
      audits.push(audit);
    }

    return { accounts, events, audits };
  };
}
