import { IReadRepoOptions } from '@shared/types/repo.types';
import {
  IEvent,
  TAuditedEntity,
} from '@shared/values/events/types/event.types';
import { IEntityDelta } from '@shared/values/history/types/history.types';

import { IAccountingEntity } from '@domain/accounting/types/accounting-entity.types';
import { REVENUE_LEDGER_CODES } from '@domain/ledger/config/revenue-codes.config';
import ILedgerAccountRepo from '@domain/ledger/repos/ledger-account.repo';
import { IEmploymentIncomeAccountService } from '@domain/ledger/types/employment-income.service.types';
import { IGainOnAssetSaleAccountService } from '@domain/ledger/types/gain-on-sale.service.types';
import { IGiftsAccountService } from '@domain/ledger/types/gifts.service.types';
import { IGrantsAccountService } from '@domain/ledger/types/grants.service.types';
import { TRevenueLedgerCode } from '@domain/ledger/types/ledger-code.types';
import { ILedgerAccount } from '@domain/ledger/types/ledger.types';
import {
  IEmploymentIncomeAccount,
  IGainOnAssetSaleAccount,
  IGiftsAccount,
  IGrantsAccount,
  IRevenueLedgerAccount,
  IServicesAccount,
  IUnrealizedGainAccount,
} from '@domain/ledger/types/revenue-account.types';
import { IServicesAccountService } from '@domain/ledger/types/services.service.types';
import { IUnrealizedGainAccountService } from '@domain/ledger/types/unrealized-gain.service.types';

interface IDependencies {
  ledgerAccountRepo: ILedgerAccountRepo;
  servicesAccountService: IServicesAccountService;
  employmentIncomeAccountService: IEmploymentIncomeAccountService;
  gainOnAssetSaleAccountService: IGainOnAssetSaleAccountService;
  unrealizedGainAccountService: IUnrealizedGainAccountService;
  grantsAccountService: IGrantsAccountService;
  giftsAccountService: IGiftsAccountService;
}

interface IRevenueAccountsBootstrapInput {
  accountingEntity: IAccountingEntity;
  repoOptions: IReadRepoOptions;
  shouldBootstrapPostingAccounts: boolean;
}

interface IRevenuePostingAccountsBootstrapInput {
  accountingEntity: IAccountingEntity;
  repoOptions: IReadRepoOptions;
  headers: {
    servicesHeader: IServicesAccount;
    employmentIncomeHeader: IEmploymentIncomeAccount;
    gainOnAssetSaleHeader: IGainOnAssetSaleAccount;
    unrealizedGainHeader: IUnrealizedGainAccount;
    grantsHeader: IGrantsAccount;
    giftsHeader: IGiftsAccount;
  };
}

export default function makeRevenueAccountsBootstrapHelper(
  deps: IDependencies
) {
  const bootstrapPostingAccounts = async ({
    accountingEntity,
    repoOptions,
    headers,
  }: IRevenuePostingAccountsBootstrapInput) => {
    const { ownerId: createdBy, id: accountingEntityId } = accountingEntity;
    const basePayload = {
      createdBy,
      accountingEntityId,
      isControlAccount: false,
    };

    const servicesAccount = await deps.servicesAccountService.createSubAccount(
      {
        ...basePayload,
        name: 'Services (Default)',
        controlAccountCode: headers.servicesHeader.code,
      },
      repoOptions
    );
    const employmentIncomeAccount =
      await deps.employmentIncomeAccountService.createSubAccount(
        {
          ...basePayload,
          name: 'Employment Income (Default)',
          controlAccountCode: headers.employmentIncomeHeader.code,
        },
        repoOptions
      );
    const gainOnAssetSaleAccount =
      await deps.gainOnAssetSaleAccountService.createSubAccount(
        {
          ...basePayload,
          name: 'Gain on Sale of Assets (Default)',
          controlAccountCode: headers.gainOnAssetSaleHeader.code,
        },
        repoOptions
      );
    const unrealizedGainAccount =
      await deps.unrealizedGainAccountService.createSubAccount(
        {
          ...basePayload,
          name: 'Unrealized Gains (Default)',
          controlAccountCode: headers.unrealizedGainHeader.code,
        },
        repoOptions
      );
    const grantsAccount = await deps.grantsAccountService.createSubAccount(
      {
        ...basePayload,
        name: 'Grants (Default)',
        controlAccountCode: headers.grantsHeader.code,
      },
      repoOptions
    );
    const giftsAccount = await deps.giftsAccountService.createSubAccount(
      {
        ...basePayload,
        name: 'Gifts (Default)',
        controlAccountCode: headers.giftsHeader.code,
      },
      repoOptions
    );

    return [
      servicesAccount,
      employmentIncomeAccount,
      gainOnAssetSaleAccount,
      unrealizedGainAccount,
      grantsAccount,
      giftsAccount,
    ];
  };

  return async ({
    accountingEntity,
    repoOptions,
    shouldBootstrapPostingAccounts,
  }: IRevenueAccountsBootstrapInput) => {
    const accountingEntityId = accountingEntity.id;
    const createdBy = accountingEntity.ownerId;
    const getExistingAccount = async <T extends IRevenueLedgerAccount>(
      code: TRevenueLedgerCode
    ) =>
      (await deps.ledgerAccountRepo.findByCode(
        code,
        accountingEntityId,
        repoOptions
      )) as T | null;
    const allAccounts: TAuditedEntity<
      IRevenueLedgerAccount,
      IRevenueLedgerAccount,
      ILedgerAccount
    >[] = [];
    const headerPayload = { createdBy, accountingEntity };

    const existingServices = await getExistingAccount<IServicesAccount>(
      REVENUE_LEDGER_CODES.SERVICES.HEADER
    );
    let servicesHeader = existingServices;
    if (!servicesHeader) {
      const account = await deps.servicesAccountService.createHeader(
        { ...headerPayload, name: 'Services' },
        repoOptions
      );
      servicesHeader = account[0];
      allAccounts.push(account);
    }

    const existingEmploymentIncome =
      await getExistingAccount<IEmploymentIncomeAccount>(
        REVENUE_LEDGER_CODES.EMPLOYMENT_INCOME.HEADER
      );
    let employmentIncomeHeader = existingEmploymentIncome;
    if (!employmentIncomeHeader) {
      const account = await deps.employmentIncomeAccountService.createHeader(
        { ...headerPayload, name: 'Employment Income' },
        repoOptions
      );
      employmentIncomeHeader = account[0];
      allAccounts.push(account);
    }

    const existingGainOnAssetSale =
      await getExistingAccount<IGainOnAssetSaleAccount>(
        REVENUE_LEDGER_CODES.GAIN_ON_ASSET_SALE.HEADER
      );
    let gainOnAssetSaleHeader = existingGainOnAssetSale;
    if (!gainOnAssetSaleHeader) {
      const account = await deps.gainOnAssetSaleAccountService.createHeader(
        { ...headerPayload, name: 'Gain on Sale of Assets' },
        repoOptions
      );
      gainOnAssetSaleHeader = account[0];
      allAccounts.push(account);
    }

    const existingUnrealizedGain =
      await getExistingAccount<IUnrealizedGainAccount>(
        REVENUE_LEDGER_CODES.UNREALIZED_GAINS.HEADER
      );
    let unrealizedGainHeader = existingUnrealizedGain;
    if (!unrealizedGainHeader) {
      const account = await deps.unrealizedGainAccountService.createHeader(
        { ...headerPayload, name: 'Unrealized Gain' },
        repoOptions
      );
      unrealizedGainHeader = account[0];
      allAccounts.push(account);
    }

    const existingGrants = await getExistingAccount<IGrantsAccount>(
      REVENUE_LEDGER_CODES.GRANTS.HEADER
    );
    let grantsHeader = existingGrants;
    if (!grantsHeader) {
      const account = await deps.grantsAccountService.createHeader(
        { ...headerPayload, name: 'Grants' },
        repoOptions
      );
      grantsHeader = account[0];
      allAccounts.push(account);
    }

    const existingGifts = await getExistingAccount<IGiftsAccount>(
      REVENUE_LEDGER_CODES.GIFTS.HEADER
    );
    let giftsHeader = existingGifts;
    if (!giftsHeader) {
      const account = await deps.giftsAccountService.createHeader(
        { ...headerPayload, name: 'Gifts' },
        repoOptions
      );
      giftsHeader = account[0];
      allAccounts.push(account);
    }

    if (shouldBootstrapPostingAccounts) {
      const postingAccounts = await bootstrapPostingAccounts({
        accountingEntity,
        repoOptions,
        headers: {
          servicesHeader,
          employmentIncomeHeader,
          gainOnAssetSaleHeader,
          unrealizedGainHeader,
          grantsHeader,
          giftsHeader,
        },
      });
      allAccounts.push(...postingAccounts);
    }

    const accounts: IRevenueLedgerAccount[] = [];
    const events: IEvent<IRevenueLedgerAccount>[] = [];
    const audits: IEntityDelta<ILedgerAccount>[] = [];
    for (const [account, accountEvents, audit] of allAccounts) {
      accounts.push(account);
      events.push(...accountEvents);
      audits.push(audit);
    }
    return { accounts, events, audits };
  };
}
