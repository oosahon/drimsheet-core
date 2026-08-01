import { IAccountingEntity } from '../../../../domain/accounting/types/accounting-entity.types';
import { EQUITY_LEDGER_CODES } from '../../../../domain/ledger/equity-account/config/equity-codes.config';
import openingBalanceEquityLedgerEntity from '../../../../domain/ledger/equity-account/entities/opening-balance-equity.entity';
import retainedEarningAccountEntity from '../../../../domain/ledger/equity-account/entities/retained-earning.entity';
import { IEquityLedgerAccount } from '../../../../domain/ledger/equity-account/types/equity-account.types';
import ILedgerAccountRepo from '../../../../domain/ledger/shared/repos/ledger-account.repo';
import { TEquityLedgerCode } from '../../../../domain/ledger/shared/types/ledger-code.types';
import { ILedgerAccount } from '../../../../domain/ledger/shared/types/ledger.types';
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
    const functionalCurrency = currencyEntity.getByCode(
      accountingEntity.functionalCurrencyCode
    );
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

    const retainedEarningsCode = EQUITY_LEDGER_CODES.RETAINED_EARNINGS.HEADER;
    const existingRetainedEarnings =
      await getExistingAccount(retainedEarningsCode);

    if (!existingRetainedEarnings) {
      const retainedEarningsAccount = retainedEarningAccountEntity.make(
        {
          name: 'Retained Earnings',
          createdBy,
          accountingEntityId,
          currency: functionalCurrency,
        },
        null
      );
      allAccounts.push(retainedEarningsAccount);
    }

    const openingBalanceEquityCode =
      EQUITY_LEDGER_CODES.OPENING_BALANCE_EQUITY.HEADER;
    const existingOpeningBalanceEquity = await getExistingAccount(
      openingBalanceEquityCode
    );

    if (!existingOpeningBalanceEquity) {
      const openingBalanceEquityAccount = openingBalanceEquityLedgerEntity.make(
        {
          name: 'Opening Balance Equity',
          createdBy,
          accountingEntityId,
          currency: functionalCurrency,
        },
        null
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
