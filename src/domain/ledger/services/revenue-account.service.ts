import { IEvent, TEntityWithEvents } from '../../../shared/types/event.types';
import currencyEntity from '../../currency/entities/currency.entity';
import { REVENUE_LEDGER_CODES } from '../config/revenue-codes.config';
import servicesAccountEntity from '../entities/04-revenue-account/02-services.entity';
import employmentIncomeAccountEntity from '../entities/04-revenue-account/04-employment-income.entity';
import GainOnAssetSaleAccountEntity from '../entities/04-revenue-account/06-gain-on-sale.entity';
import unrealizedGainAccountEntity from '../entities/04-revenue-account/07-unrealized-gain.entity';
import ILedgerAccountRepo from '../repos/ledger-account.repo';
import {
  TEmploymentIncomeLedgerCode,
  TGainOnAssetSaleLedgerCode,
  TRevenueLedgerCode,
  TServicesLedgerCode,
  TUnrealizedGainLedgerCode,
} from '../types/ledger-code.types';
import IRevenueAccountService from '../types/revenue-account.service.types';
import {
  IEmploymentIncomeAccount,
  IGainOnAssetSaleAccount,
  IRevenueLedgerAccount,
  IServicesAccount,
  IUnrealizedGainAccount,
} from '../types/revenue-account.types';

type TBootstrapHeaders = IRevenueAccountService['bootstrapHeaderAccounts'];
type TBootstrapIndividualPostingAccounts =
  IRevenueAccountService['bootstrapIndividualPostingAccounts'];

export default function makeRevenueAccountService(
  repo: ILedgerAccountRepo
): IRevenueAccountService {
  /**
   * Bootstraps header revenue accounts for a new accounting entity
   *  - Services:                401000
   *  - Employment Income:       403000
   *  - Gain on Sale of Assets:  405000
   *  - Unrealized Gain:         406000
   */
  const bootstrapHeaderAccounts: TBootstrapHeaders = async (
    accountingEntity,
    repoOptions,
    shouldBootstrapPostingAccounts
  ) => {
    const accountingEntityId = accountingEntity.id;
    const functionalCurrency = currencyEntity.getByCode(
      accountingEntity.functionalCurrencyCode
    );
    const createdBy = accountingEntity.ownerId;

    const getExistingAccounts = async <T extends IRevenueLedgerAccount>(
      code: TRevenueLedgerCode
    ) => {
      return (await repo.findByCode(
        code,
        accountingEntityId,
        repoOptions
      )) as T | null;
    };

    const allAccounts: TEntityWithEvents<
      IRevenueLedgerAccount,
      IRevenueLedgerAccount
    >[] = [];

    const basePayload = {
      createdBy,
      accountingEntityId,
      currency: functionalCurrency,
    };

    /**
     * ==================== Services ====================
     */
    const servicesCode = REVENUE_LEDGER_CODES.SERVICES.HEADER;
    const existingServices = await getExistingAccounts(servicesCode);

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

    /**
     * ==================== Employment Income ====================
     */
    const employmentIncomeCode = REVENUE_LEDGER_CODES.EMPLOYMENT_INCOME.HEADER;
    const existingEmploymentIncome =
      await getExistingAccounts(employmentIncomeCode);

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

    /**
     * ==================== Gain on Sale of Assets ====================
     */
    const gainOnAssetSaleCode = REVENUE_LEDGER_CODES.GAIN_ON_ASSET_SALE.HEADER;
    const existingGainOnAssetSaleOfAssets =
      await getExistingAccounts(gainOnAssetSaleCode);

    let gainOnAssetSaleHeader: IGainOnAssetSaleAccount;

    if (!existingGainOnAssetSaleOfAssets) {
      const GainOnAssetSaleOfAssetsAccount =
        GainOnAssetSaleAccountEntity.makeHeader({
          ...basePayload,
          name: 'Gain on Sale of Assets',
        });
      gainOnAssetSaleHeader =
        GainOnAssetSaleOfAssetsAccount[0] as IGainOnAssetSaleAccount;
      allAccounts.push(GainOnAssetSaleOfAssetsAccount);
    } else {
      gainOnAssetSaleHeader =
        existingGainOnAssetSaleOfAssets as IGainOnAssetSaleAccount;
    }

    /**
     * ==================== Unrealized Gain ====================
     */
    const unrealizedGainCode = REVENUE_LEDGER_CODES.UNREALIZED_GAINS.HEADER;
    const existingUnrealizedGain =
      await getExistingAccounts(unrealizedGainCode);

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

    if (shouldBootstrapPostingAccounts) {
      const postingAccountsWithEvents =
        await bootstrapIndividualPostingAccounts(
          accountingEntity,
          {
            servicesHeader,
            employmentIncomeHeader,
            gainOnAssetSaleHeader,
            unrealizedGainHeader,
          },
          repoOptions
        );
      allAccounts.push(...postingAccountsWithEvents);
    }

    const accounts: IRevenueLedgerAccount[] = [];
    const events: IEvent<IRevenueLedgerAccount>[] = [];

    for (const [account, accountEvents] of allAccounts) {
      accounts.push(account);
      events.push(...accountEvents);
    }

    return { accounts, events };
  };

  const bootstrapIndividualPostingAccounts: TBootstrapIndividualPostingAccounts =
    async (accountingEntity, headers, repoOptions) => {
      const {
        ownerId,
        id: accountingEntityId,
        functionalCurrencyCode,
      } = accountingEntity;

      const functionalCurrency = currencyEntity.getByCode(
        functionalCurrencyCode
      );

      const revenueAccounts: TEntityWithEvents<
        IRevenueLedgerAccount,
        IRevenueLedgerAccount
      >[] = [];

      /**
       * Services (Default)
       */
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

      /**
       * Employment Income (Default)
       */
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

      /**
       * Gain on Sale of Assets (Default)
       */
      const gainOnAssetsAccount = GainOnAssetSaleAccountEntity.make(
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
      revenueAccounts.push(gainOnAssetsAccount);

      /**
       * Unrealized Gains (Default)
       */
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

      return revenueAccounts;
    };

  return Object.freeze({
    bootstrapHeaderAccounts,
    bootstrapIndividualPostingAccounts,
  });
}
