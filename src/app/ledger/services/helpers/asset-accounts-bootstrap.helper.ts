import { IAccountingEntity } from '../../../../domain/accounting/types/accounting-entity.types';
import assetSuspenseAccountEntity from '../../../../domain/ledger/asset-account/entities/suspense-account.entity';
import { ASSET_LEDGER_CODES } from '../../../../domain/ledger/config/asset-codes.config';
import ILedgerAccountRepo from '../../../../domain/ledger/repos/ledger-account.repo';
import {
  EAssetAccountBehavior,
  EAssetSubType,
  IAssetLedgerAccount,
  IReceivablesAccount,
  IStatutoryReceivableAccount,
} from '../../../../domain/ledger/types/asset-account.types';
import ICashAccountService from '../../../../domain/ledger/types/cash-account.service.types';
import {
  TAssetLedgerCode,
  TReceivablesLedgerCode,
} from '../../../../domain/ledger/types/ledger-code.types';
import {
  ELedgerType,
  ILedgerAccount,
} from '../../../../domain/ledger/types/ledger.types';
import { IReceivablesAccountService } from '../../../../domain/ledger/types/receivables-account.service.types';
import currencyEntity from '../../../../domain/money/entities/currency.entity';
import { IReadRepoOptions } from '../../../../shared/types/repo.types';
import {
  IEvent,
  TAuditedEntity,
} from '../../../../shared/values/events/types/event.types';
import { IEntityDelta } from '../../../../shared/values/history/types/history.types';

interface IDependencies {
  ledgerAccountRepo: ILedgerAccountRepo;
  cashAccountService: ICashAccountService;
  receivablesAccountService: IReceivablesAccountService;
}

interface IAssetAccountsBootstrapInput {
  accountingEntity: IAccountingEntity;
  repoOptions: IReadRepoOptions;
  shouldBootstrapPostingAccounts: boolean;
}

interface IAssetPostingAccountsBootstrapInput {
  accountingEntity: IAccountingEntity;
  headers: { statutoryReceivablesHeader: IStatutoryReceivableAccount };
  repoOptions: IReadRepoOptions;
}

export default function makeAssetAccountsBootstrapHelper(deps: IDependencies) {
  const bootstrapPostingAccounts = async ({
    accountingEntity,
    headers,
    repoOptions,
  }: IAssetPostingAccountsBootstrapInput) => {
    const {
      ownerId,
      id: accountingEntityId,
      functionalCurrencyCode,
    } = accountingEntity;

    const functionalCurrency = currencyEntity.getByCode(functionalCurrencyCode);

    const assetAccounts: TAuditedEntity<
      IAssetLedgerAccount,
      IAssetLedgerAccount,
      ILedgerAccount
    >[] = [];

    const existingSuspense = await deps.ledgerAccountRepo.findBySubType(
      accountingEntityId,
      ELedgerType.Asset,
      EAssetSubType.Suspense,
      repoOptions
    );

    if (!existingSuspense.length) {
      const account = assetSuspenseAccountEntity.make(
        {
          accountingEntityId,
          currency: functionalCurrency,
          name: 'Asset Suspense Account',
          createdBy: ownerId,
        },
        null
      );
      assetAccounts.push(account);
    }

    const existingStatutoryReceivables =
      (await deps.ledgerAccountRepo.findByBehavior(
        accountingEntityId,
        EAssetAccountBehavior.StatutoryReceivable,
        repoOptions
      )) as IStatutoryReceivableAccount[];

    if (existingStatutoryReceivables.length === 1) {
      const account =
        await deps.receivablesAccountService.createStatutoryReceivableSubAccount(
          {
            name: 'Statutory Receivables (Default)',
            userId: ownerId,
            accountingEntity,
            currency: functionalCurrency,
            isControlAccount: false,
            controlAccountCode: headers.statutoryReceivablesHeader.code,
          },
          repoOptions
        );
      assetAccounts.push(account);
    }

    return assetAccounts;
  };

  return async ({
    accountingEntity,
    repoOptions,
    shouldBootstrapPostingAccounts,
  }: IAssetAccountsBootstrapInput) => {
    const accountingEntityId = accountingEntity.id;
    const functionalCurrency = currencyEntity.getByCode(
      accountingEntity.functionalCurrencyCode
    );
    const createdBy = accountingEntity.ownerId;

    const getExistingAccount = async <T extends IAssetLedgerAccount>(
      code: TAssetLedgerCode
    ) => {
      return (await deps.ledgerAccountRepo.findByCode(
        code,
        accountingEntityId,
        repoOptions
      )) as T | null;
    };

    const allAccounts: TAuditedEntity<
      IAssetLedgerAccount,
      IAssetLedgerAccount,
      ILedgerAccount
    >[] = [];

    const cashHeaderCode = ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER;
    const existingCashHeader = await getExistingAccount(cashHeaderCode);

    if (!existingCashHeader) {
      const cashHeader = await deps.cashAccountService.createHeader(
        {
          name: 'Cash and Cash Equivalents',
          userId: createdBy,
          accountingEntity,
        },
        repoOptions
      );
      allAccounts.push(cashHeader);
    }

    const receivablesHeaderCode = ASSET_LEDGER_CODES.RECEIVABLES.HEADER;
    let existingReceivablesHeader =
      await getExistingAccount<IReceivablesAccount>(receivablesHeaderCode);

    if (!existingReceivablesHeader) {
      const receivables = await deps.receivablesAccountService.createHeader(
        {
          name: 'Receivables',
          userId: createdBy,
          accountingEntity,
        },
        repoOptions
      );
      existingReceivablesHeader = receivables[0];
      allAccounts.push(receivables);
    }

    const tradeReceivablesCode = ASSET_LEDGER_CODES.RECEIVABLES.TRADE;
    const existingTradeReceivables =
      await getExistingAccount<IReceivablesAccount>(tradeReceivablesCode);

    if (!existingTradeReceivables) {
      const tradeReceivables =
        await deps.receivablesAccountService.createTradeReceivableSubAccount(
          {
            name: 'Trade Receivables',
            userId: createdBy,
            accountingEntity,
            currency: functionalCurrency,
            isControlAccount: true,
            controlAccountCode:
              existingReceivablesHeader.code as TReceivablesLedgerCode,
          },
          repoOptions
        );
      allAccounts.push(tradeReceivables);
    }

    const statutoryReceivablesCode = ASSET_LEDGER_CODES.RECEIVABLES.STATUTORY;
    const existingStatutoryReceivables = await getExistingAccount(
      statutoryReceivablesCode
    );

    let statutoryReceivablesHeader: IStatutoryReceivableAccount;

    if (!existingStatutoryReceivables) {
      const statutoryReceivables =
        await deps.receivablesAccountService.createStatutoryReceivableSubAccount(
          {
            name: 'Statutory Receivables',
            userId: createdBy,
            accountingEntity,
            currency: functionalCurrency,
            isControlAccount: true,
            controlAccountCode:
              existingReceivablesHeader.code as TReceivablesLedgerCode,
          },
          repoOptions
        );
      statutoryReceivablesHeader =
        statutoryReceivables[0] as IStatutoryReceivableAccount;
      allAccounts.push(statutoryReceivables);
    } else {
      statutoryReceivablesHeader =
        existingStatutoryReceivables as IStatutoryReceivableAccount;
    }

    if (shouldBootstrapPostingAccounts) {
      const postingAccounts = await bootstrapPostingAccounts({
        accountingEntity,
        headers: { statutoryReceivablesHeader },
        repoOptions,
      });
      allAccounts.push(...postingAccounts);
    }

    const accounts: IAssetLedgerAccount[] = [];
    const events: IEvent<IAssetLedgerAccount>[] = [];
    const audits: IEntityDelta<ILedgerAccount>[] = [];

    for (const [account, accountEvents, audit] of allAccounts) {
      accounts.push(account);
      events.push(...accountEvents);
      audits.push(audit);
    }

    return { accounts, events, audits };
  };
}
