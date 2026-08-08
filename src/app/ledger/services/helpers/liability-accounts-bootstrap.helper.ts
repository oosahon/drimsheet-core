import { IReadRepoOptions } from '@shared/types/repo.types';
import {
  IEvent,
  TAuditedEntity,
} from '@shared/values/events/types/event.types';
import { IEntityDelta } from '@shared/values/history/types/history.types';

import { IAccountingEntity } from '@domain/accounting/types/accounting-entity.types';
import { LIABILITY_LEDGER_CODES } from '@domain/ledger/config/liability-codes.config';
import ILedgerAccountRepo from '@domain/ledger/repos/ledger-account.repo';
import { TLiabilityLedgerCode } from '@domain/ledger/types/ledger-code.types';
import { ELedgerType, ILedgerAccount } from '@domain/ledger/types/ledger.types';
import {
  ELiabilityAccountBehavior,
  ELiabilitySubType,
  ILiabilityLedgerAccount,
  IPayableAccount,
  IStatutoryPayableAccount,
  IStatutoryPayableAccountMeta,
  ITradePayableAccountMeta,
} from '@domain/ledger/types/liability-account.types';
import { IPayablesAccountService } from '@domain/ledger/types/payables.service.types';
import { IShortTermLoanAccountService } from '@domain/ledger/types/short-term-loan.service.types';
import { ISuspenseAccountService } from '@domain/ledger/types/suspense-account.service.types';
import currencyEntity from '@domain/money/entities/currency.entity';

interface IDependencies {
  ledgerAccountRepo: ILedgerAccountRepo;
  suspenseAccountService: ISuspenseAccountService;
  payablesAccountService: IPayablesAccountService;
  shortTermLoanAccountService: IShortTermLoanAccountService;
}

interface ILiabilityAccountsBootstrapInput {
  accountingEntity: IAccountingEntity;
  repoOptions: IReadRepoOptions;
  shouldBootstrapPostingAccounts: boolean;
}

interface ILiabilityPostingAccountsBootstrapInput {
  accountingEntity: IAccountingEntity;
  headers: { statutoryPayablesHeader: IStatutoryPayableAccount };
  repoOptions: IReadRepoOptions;
}

export default function makeLiabilityAccountsBootstrapHelper(
  deps: IDependencies
) {
  const bootstrapPostingAccounts = async ({
    accountingEntity,
    headers,
    repoOptions,
  }: ILiabilityPostingAccountsBootstrapInput) => {
    const {
      ownerId,
      id: accountingEntityId,
      functionalCurrencyCode,
    } = accountingEntity;

    const functionalCurrency = currencyEntity.getByCode(functionalCurrencyCode);

    const liabilityAccounts: TAuditedEntity<
      ILiabilityLedgerAccount,
      ILiabilityLedgerAccount,
      ILedgerAccount
    >[] = [];

    const existingSuspense = await deps.ledgerAccountRepo.findBySubType(
      accountingEntityId,
      ELedgerType.Liability,
      ELiabilitySubType.Suspense,
      repoOptions
    );

    if (!existingSuspense.length) {
      const account = await deps.suspenseAccountService.createLiabilitySuspense(
        {
          accountingEntityId,
          currency: functionalCurrency,
          name: 'Liability Suspense Account',
          createdBy: ownerId,
        },
        repoOptions
      );
      liabilityAccounts.push(account);
    }

    const existingStatutoryPayables =
      (await deps.ledgerAccountRepo.findByBehavior(
        accountingEntityId,
        ELiabilityAccountBehavior.TaxPayable,
        repoOptions
      )) as IStatutoryPayableAccount[];

    if (existingStatutoryPayables.length === 1) {
      const account =
        await deps.payablesAccountService.createStatutoryPayableSubAccount(
          {
            name: 'Statutory Payables (Default)',
            createdBy: ownerId,
            accountingEntity,
            currency: functionalCurrency,
            isControlAccount: false,
            controlAccountCode: headers.statutoryPayablesHeader.code,
            meta: null as unknown as IStatutoryPayableAccountMeta,
          },
          repoOptions
        );
      liabilityAccounts.push(account);
    }

    return liabilityAccounts;
  };

  return async ({
    accountingEntity,
    repoOptions,
    shouldBootstrapPostingAccounts,
  }: ILiabilityAccountsBootstrapInput) => {
    const accountingEntityId = accountingEntity.id;
    const functionalCurrency = currencyEntity.getByCode(
      accountingEntity.functionalCurrencyCode
    );
    const createdBy = accountingEntity.ownerId;

    const getExistingAccount = async <T extends ILiabilityLedgerAccount>(
      code: TLiabilityLedgerCode
    ) => {
      return (await deps.ledgerAccountRepo.findByCode(
        code,
        accountingEntityId,
        repoOptions
      )) as T | null;
    };

    const allAccounts: TAuditedEntity<
      ILiabilityLedgerAccount,
      ILiabilityLedgerAccount,
      ILedgerAccount
    >[] = [];

    const shortTermDebtHeaderCode =
      LIABILITY_LEDGER_CODES.SHORT_TERM_DEBT.HEADER;
    const existingShortTermDebtHeader = await getExistingAccount(
      shortTermDebtHeaderCode
    );

    if (!existingShortTermDebtHeader) {
      const shortTermDebt = await deps.shortTermLoanAccountService.createHeader(
        {
          name: 'Short Term Debt',
          userId: createdBy,
          accountingEntity,
          createdBy,
        },
        repoOptions
      );
      allAccounts.push(shortTermDebt);
    }

    const payablesHeaderCode = LIABILITY_LEDGER_CODES.PAYABLES.HEADER;
    let existingPayablesHeader =
      await getExistingAccount<IPayableAccount>(payablesHeaderCode);

    if (!existingPayablesHeader) {
      const payables = await deps.payablesAccountService.createHeader(
        {
          name: 'Payables',
          createdBy,
          accountingEntity,
        },
        repoOptions
      );
      existingPayablesHeader = payables[0];
      allAccounts.push(payables);
    }

    const tradePayablesCode = LIABILITY_LEDGER_CODES.PAYABLES.TRADE;
    let existingTradePayables =
      await getExistingAccount<IPayableAccount>(tradePayablesCode);

    if (!existingTradePayables) {
      const tradePayables =
        await deps.payablesAccountService.createTradePayableSubAccount(
          {
            name: 'Trade Payables',
            createdBy,
            accountingEntity,
            isControlAccount: true,
            controlAccountCode: existingPayablesHeader.code,
            meta: null as unknown as ITradePayableAccountMeta,
          },
          repoOptions
        );
      existingTradePayables = tradePayables[0];
      allAccounts.push(tradePayables);
    }

    const statutoryPayablesCode = LIABILITY_LEDGER_CODES.PAYABLES.STATUTORY;
    const existingStatutoryPayables = await getExistingAccount(
      statutoryPayablesCode
    );

    let statutoryPayablesHeader: IStatutoryPayableAccount;

    if (!existingStatutoryPayables) {
      const statutoryPayables =
        await deps.payablesAccountService.createStatutoryPayableSubAccount(
          {
            name: 'Statutory Payables',
            createdBy,
            accountingEntity,
            currency: functionalCurrency,
            isControlAccount: true,
            controlAccountCode: existingPayablesHeader.code,
            meta: null as unknown as IStatutoryPayableAccountMeta,
          },
          repoOptions
        );
      statutoryPayablesHeader =
        statutoryPayables[0] as IStatutoryPayableAccount;
      allAccounts.push(statutoryPayables);
    } else {
      statutoryPayablesHeader =
        existingStatutoryPayables as IStatutoryPayableAccount;
    }

    if (shouldBootstrapPostingAccounts) {
      const postingAccounts = await bootstrapPostingAccounts({
        accountingEntity,
        headers: { statutoryPayablesHeader },
        repoOptions,
      });
      allAccounts.push(...postingAccounts);
    }

    const accounts: ILiabilityLedgerAccount[] = [];
    const events: IEvent<ILiabilityLedgerAccount>[] = [];
    const audits: IEntityDelta<ILedgerAccount>[] = [];

    for (const [account, accountEvents, audit] of allAccounts) {
      accounts.push(account);
      events.push(...accountEvents);
      audits.push(audit);
    }

    return { accounts, events, audits };
  };
}
