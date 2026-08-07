import { IAccountingEntity } from '../../../../domain/accounting/types/accounting-entity.types';
import { REVENUE_LEDGER_CODES } from '../../../../domain/ledger/config/revenue-codes.config';
import ILedgerAccountRepo from '../../../../domain/ledger/repos/ledger-account.repo';
import employmentIncomeAccountEntity from '../../../../domain/ledger/revenue-account/entities/employment-income.entity';
import gainOnAssetSaleAccountEntity from '../../../../domain/ledger/revenue-account/entities/gain-on-sale.entity';
import giftsAccountEntity from '../../../../domain/ledger/revenue-account/entities/gifts.entity';
import grantsAccountEntity from '../../../../domain/ledger/revenue-account/entities/grants.entity';
import servicesAccountEntity from '../../../../domain/ledger/revenue-account/entities/services.entity';
import unrealizedGainAccountEntity from '../../../../domain/ledger/revenue-account/entities/unrealized-gain.entity';
import {
  IEmploymentIncomeAccount,
  IGainOnAssetSaleAccount,
  IGiftsAccount,
  IGrantsAccount,
  IRevenueLedgerAccount,
  IServicesAccount,
  IUnrealizedGainAccount,
} from '../../../../domain/ledger/revenue-account/types/revenue-account.types';
import {
  TEmploymentIncomeLedgerCode,
  TGainOnAssetSaleLedgerCode,
  TGiftsLedgerCode,
  TGrantsLedgerCode,
  TRevenueLedgerCode,
  TServicesLedgerCode,
  TUnrealizedGainLedgerCode,
} from '../../../../domain/ledger/types/ledger-code.types';
import { ILedgerAccount } from '../../../../domain/ledger/types/ledger.types';
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

interface IRevenueAccountsBootstrapInput {
  accountingEntity: IAccountingEntity;
  repoOptions: IReadRepoOptions;
  shouldBootstrapPostingAccounts: boolean;
}

interface IRevenuePostingAccountsBootstrapInput {
  accountingEntity: IAccountingEntity;
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
  const bootstrapPostingAccounts = ({
    accountingEntity,
    headers,
  }: IRevenuePostingAccountsBootstrapInput) => {
    const {
      ownerId,
      id: accountingEntityId,
      functionalCurrencyCode,
    } = accountingEntity;

    const functionalCurrency = currencyEntity.getByCode(functionalCurrencyCode);

    const revenueAccounts: TAuditedEntity<
      IRevenueLedgerAccount,
      IRevenueLedgerAccount,
      ILedgerAccount
    >[] = [];

    const servicesAccount = servicesAccountEntity.make(
      {
        name: 'Services (Default)',
        createdBy: ownerId,
        accountingEntityId,
        currency: functionalCurrency,
        isControlAccount: false,
        controlAccountId: headers.servicesHeader.id,
        meta: null,
      },
      {
        precedingCode: headers.servicesHeader.code as TServicesLedgerCode,
        parentMaterializedPath: headers.servicesHeader
          .materializedPath as TServicesLedgerCode,
      }
    );
    revenueAccounts.push(servicesAccount);

    const employmentIncomeAccount = employmentIncomeAccountEntity.make(
      {
        name: 'Employment Income (Default)',
        createdBy: ownerId,
        accountingEntityId,
        currency: functionalCurrency,
        isControlAccount: false,
        controlAccountId: headers.employmentIncomeHeader.id,
        meta: null,
      },
      {
        precedingCode: headers.employmentIncomeHeader
          .code as TEmploymentIncomeLedgerCode,
        parentMaterializedPath: headers.employmentIncomeHeader
          .materializedPath as TEmploymentIncomeLedgerCode,
      }
    );
    revenueAccounts.push(employmentIncomeAccount);

    const gainOnAssetSaleAccount = gainOnAssetSaleAccountEntity.make(
      {
        name: 'Gain on Sale of Assets (Default)',
        createdBy: ownerId,
        accountingEntityId,
        currency: functionalCurrency,
        isControlAccount: false,
        controlAccountId: headers.gainOnAssetSaleHeader.id,
        meta: null,
      },
      {
        precedingCode: headers.gainOnAssetSaleHeader
          .code as TGainOnAssetSaleLedgerCode,
        parentMaterializedPath: headers.gainOnAssetSaleHeader
          .materializedPath as TGainOnAssetSaleLedgerCode,
      }
    );
    revenueAccounts.push(gainOnAssetSaleAccount);

    const unrealizedGainsAccount = unrealizedGainAccountEntity.make(
      {
        name: 'Unrealized Gains (Default)',
        createdBy: ownerId,
        accountingEntityId,
        currency: functionalCurrency,
        isControlAccount: false,
        controlAccountId: headers.unrealizedGainHeader.id,
        meta: null,
      },
      {
        precedingCode: headers.unrealizedGainHeader
          .code as TUnrealizedGainLedgerCode,
        parentMaterializedPath: headers.unrealizedGainHeader
          .materializedPath as TUnrealizedGainLedgerCode,
      }
    );
    revenueAccounts.push(unrealizedGainsAccount);

    const grantsAccount = grantsAccountEntity.make(
      {
        name: 'Grants (Default)',
        createdBy: ownerId,
        accountingEntityId,
        currency: functionalCurrency,
        isControlAccount: false,
        controlAccountId: headers.grantsHeader.id,
        meta: null,
      },
      {
        precedingCode: headers.grantsHeader.code as TGrantsLedgerCode,
        parentMaterializedPath: headers.grantsHeader
          .materializedPath as TGrantsLedgerCode,
      }
    );
    revenueAccounts.push(grantsAccount);

    const giftsAccount = giftsAccountEntity.make(
      {
        name: 'Gifts (Default)',
        createdBy: ownerId,
        accountingEntityId,
        currency: functionalCurrency,
        isControlAccount: false,
        controlAccountId: headers.giftsHeader.id,
        meta: null,
      },
      {
        precedingCode: headers.giftsHeader.code as TGiftsLedgerCode,
        parentMaterializedPath: headers.giftsHeader
          .materializedPath as TGiftsLedgerCode,
      }
    );
    revenueAccounts.push(giftsAccount);

    return revenueAccounts;
  };

  return async ({
    accountingEntity,
    repoOptions,
    shouldBootstrapPostingAccounts,
  }: IRevenueAccountsBootstrapInput) => {
    const accountingEntityId = accountingEntity.id;
    const functionalCurrency = currencyEntity.getByCode(
      accountingEntity.functionalCurrencyCode
    );
    const createdBy = accountingEntity.ownerId;

    const getExistingAccount = async <T extends IRevenueLedgerAccount>(
      code: TRevenueLedgerCode
    ) => {
      return (await deps.ledgerAccountRepo.findByCode(
        code,
        accountingEntityId,
        repoOptions
      )) as T | null;
    };

    const allAccounts: TAuditedEntity<
      IRevenueLedgerAccount,
      IRevenueLedgerAccount,
      ILedgerAccount
    >[] = [];

    const basePayload = {
      createdBy,
      accountingEntityId,
      currency: functionalCurrency,
    };

    const servicesCode = REVENUE_LEDGER_CODES.SERVICES.HEADER;
    const existingServices = await getExistingAccount(servicesCode);

    let servicesHeader: IServicesAccount;

    if (!existingServices) {
      const servicesAccount = servicesAccountEntity.makeHeader({
        ...basePayload,
        name: 'Services',
      });
      servicesHeader = servicesAccount[0] as IServicesAccount;
      allAccounts.push(servicesAccount);
    } else {
      servicesHeader = existingServices as IServicesAccount;
    }

    const employmentIncomeCode = REVENUE_LEDGER_CODES.EMPLOYMENT_INCOME.HEADER;
    const existingEmploymentIncome =
      await getExistingAccount(employmentIncomeCode);

    let employmentIncomeHeader: IEmploymentIncomeAccount;

    if (!existingEmploymentIncome) {
      const employmentIncomeAccount = employmentIncomeAccountEntity.makeHeader({
        ...basePayload,
        name: 'Employment Income',
      });
      employmentIncomeHeader =
        employmentIncomeAccount[0] as IEmploymentIncomeAccount;
      allAccounts.push(employmentIncomeAccount);
    } else {
      employmentIncomeHeader =
        existingEmploymentIncome as IEmploymentIncomeAccount;
    }

    const gainOnAssetSaleCode = REVENUE_LEDGER_CODES.GAIN_ON_ASSET_SALE.HEADER;
    const existingGainOnAssetSale =
      await getExistingAccount(gainOnAssetSaleCode);

    let gainOnAssetSaleHeader: IGainOnAssetSaleAccount;

    if (!existingGainOnAssetSale) {
      const gainOnAssetSaleAccount = gainOnAssetSaleAccountEntity.makeHeader({
        ...basePayload,
        name: 'Gain on Sale of Assets',
      });
      gainOnAssetSaleHeader =
        gainOnAssetSaleAccount[0] as IGainOnAssetSaleAccount;
      allAccounts.push(gainOnAssetSaleAccount);
    } else {
      gainOnAssetSaleHeader =
        existingGainOnAssetSale as IGainOnAssetSaleAccount;
    }

    const unrealizedGainCode = REVENUE_LEDGER_CODES.UNREALIZED_GAINS.HEADER;
    const existingUnrealizedGain = await getExistingAccount(unrealizedGainCode);

    let unrealizedGainHeader: IUnrealizedGainAccount;

    if (!existingUnrealizedGain) {
      const unrealizedGainAccount = unrealizedGainAccountEntity.makeHeader({
        ...basePayload,
        name: 'Unrealized Gain',
      });
      unrealizedGainHeader = unrealizedGainAccount[0] as IUnrealizedGainAccount;
      allAccounts.push(unrealizedGainAccount);
    } else {
      unrealizedGainHeader = existingUnrealizedGain as IUnrealizedGainAccount;
    }

    const grantsCode = REVENUE_LEDGER_CODES.GRANTS.HEADER;
    const existingGrants = await getExistingAccount(grantsCode);

    let grantsHeader: IGrantsAccount;

    if (!existingGrants) {
      const grantsAccount = grantsAccountEntity.makeHeader({
        ...basePayload,
        name: 'Grants',
      });
      grantsHeader = grantsAccount[0] as IGrantsAccount;
      allAccounts.push(grantsAccount);
    } else {
      grantsHeader = existingGrants as IGrantsAccount;
    }

    const giftsCode = REVENUE_LEDGER_CODES.GIFTS.HEADER;
    const existingGifts = await getExistingAccount(giftsCode);

    let giftsHeader: IGiftsAccount;

    if (!existingGifts) {
      const giftsAccount = giftsAccountEntity.makeHeader({
        ...basePayload,
        name: 'Gifts',
      });
      giftsHeader = giftsAccount[0] as IGiftsAccount;
      allAccounts.push(giftsAccount);
    } else {
      giftsHeader = existingGifts as IGiftsAccount;
    }

    if (shouldBootstrapPostingAccounts) {
      const postingAccounts = bootstrapPostingAccounts({
        accountingEntity,
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
