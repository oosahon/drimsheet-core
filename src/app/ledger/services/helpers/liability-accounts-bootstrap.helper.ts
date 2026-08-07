import { IAccountingEntity } from '../../../../domain/accounting/types/accounting-entity.types';
import { LIABILITY_LEDGER_CODES } from '../../../../domain/ledger/config/liability-codes.config';
import payableAccountEntity from '../../../../domain/ledger/liability-account/entities/payables.entity';
import shortTermLoanAccountEntity from '../../../../domain/ledger/liability-account/entities/short-term-loan.entity';
import liabilitySuspenseAccountEntity from '../../../../domain/ledger/liability-account/entities/suspense-account.entity';
import {
  ELiabilityAccountBehavior,
  ELiabilitySubType,
  ILiabilityLedgerAccount,
  IPayableAccount,
  IStatutoryPayableAccount,
} from '../../../../domain/ledger/liability-account/types/liability-account.types';
import ILedgerAccountRepo from '../../../../domain/ledger/repos/ledger-account.repo';
import {
  TLiabilityLedgerCode,
  TPayablesLedgerCode,
} from '../../../../domain/ledger/types/ledger-code.types';
import {
  ELedgerType,
  ILedgerAccount,
} from '../../../../domain/ledger/types/ledger.types';
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
      const account = liabilitySuspenseAccountEntity.make(
        {
          accountingEntityId,
          currency: functionalCurrency,
          name: 'Liability Suspense Account',
          createdBy: ownerId,
        },
        null
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
      const account = payableAccountEntity.makeStatutoryPayableAccount(
        {
          name: 'Statutory Payables (Default)',
          createdBy: ownerId,
          accountingEntityId,
          currency: functionalCurrency,
          isControlAccount: false,
          controlAccountId: headers.statutoryPayablesHeader.id,
          meta: null,
        },
        {
          precedingCode: headers.statutoryPayablesHeader
            .code as TPayablesLedgerCode,
          parentMaterializedPath: headers.statutoryPayablesHeader
            .materializedPath as TPayablesLedgerCode,
        }
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
      const shortTermDebt = shortTermLoanAccountEntity.makeHeader({
        name: 'Short Term Debt',
        createdBy,
        accountingEntityId,
        currency: functionalCurrency,
      });
      allAccounts.push(shortTermDebt);
    }

    const payablesHeaderCode = LIABILITY_LEDGER_CODES.PAYABLES.HEADER;
    let existingPayablesHeader =
      await getExistingAccount<IPayableAccount>(payablesHeaderCode);

    if (!existingPayablesHeader) {
      const payables = payableAccountEntity.makeHeader({
        name: 'Payables',
        createdBy,
        accountingEntityId,
        currency: functionalCurrency,
      });
      existingPayablesHeader = payables[0];
      allAccounts.push(payables);
    }

    const tradePayablesCode = LIABILITY_LEDGER_CODES.PAYABLES.TRADE;
    let existingTradePayables =
      await getExistingAccount<IPayableAccount>(tradePayablesCode);

    if (!existingTradePayables) {
      const tradePayables = payableAccountEntity.makeTradePayableAccount(
        {
          name: 'Trade Payables',
          createdBy,
          accountingEntityId,
          currency: functionalCurrency,
          isControlAccount: true,
          controlAccountId: existingPayablesHeader.id,
          meta: null,
        },
        {
          precedingCode: existingPayablesHeader.code as TPayablesLedgerCode,
          parentMaterializedPath:
            existingPayablesHeader.materializedPath as TPayablesLedgerCode,
        }
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
        payableAccountEntity.makeStatutoryPayableAccount(
          {
            name: 'Statutory Payables',
            createdBy,
            accountingEntityId,
            currency: functionalCurrency,
            isControlAccount: true,
            controlAccountId: existingPayablesHeader.id,
            meta: null,
          },
          {
            precedingCode: existingTradePayables.code as TPayablesLedgerCode,
            parentMaterializedPath:
              existingPayablesHeader.materializedPath as TPayablesLedgerCode,
          }
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
