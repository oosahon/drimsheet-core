import { TEntityWithEvents } from '../../../shared/types/event.types';
import { IRepoOptions } from '../../../shared/types/repo.types';
import { IAccountingEntity } from '../../accounting-entity/types/accounting-entity.types';
import { REVENUE_LEDGER_CODES } from '../config/revenue-codes.config';
import servicesAccountEntity from '../entities/04-revenue-account/02-services.entity';
import employmentIncomeAccountEntity from '../entities/04-revenue-account/04-employment-income.entity';
import GainOnAssetSaleAccountEntity from '../entities/04-revenue-account/06-gain-on-sale.entity';
import unrealizedGainAccountEntity from '../entities/04-revenue-account/07-unrealized-gain.entity';
import ILedgerAccountRepo from '../repos/ledger-account.repo';
import {
  TEmploymentIncomeLedgerCode,
  TGainOnAssetSaleLedgerCode,
  TServicesLedgerCode,
  TUnrealizedGainLedgerCode,
} from '../types/ledger-code.types';
import { ELedgerType } from '../types/ledger.types';
import {
  ERevenueSubType,
  IRevenueLedgerAccount,
} from '../types/revenue-account.types';
import { canBootstrapPostingAccount } from './helpers/can-bootstrap-posting-account';

export interface IRevenueAccountService {
  bootstrapIndividualHeaderAccounts(
    accountingEntity: IAccountingEntity,
    repoOptions: IRepoOptions
  ): Promise<TEntityWithEvents<IRevenueLedgerAccount, IRevenueLedgerAccount>[]>;

  bootstrapIndividualPostingAccounts(
    accountingEntity: IAccountingEntity,
    repoOptions: IRepoOptions
  ): Promise<TEntityWithEvents<IRevenueLedgerAccount, IRevenueLedgerAccount>[]>;
}

export default function makeRevenueAccountBootstrapService(
  repo: ILedgerAccountRepo
): IRevenueAccountService {
  const service: IRevenueAccountService = {
    /**
     * Sets up the following revenue accounts for an individual:
     *  - Services:                401000
     *  - Employment Income:       403000
     *  - Gain on Sale of Assets:  405000
     *  - Unrealized Gain:         406000
     * @param accountingEntity: The individual entity account
     * @param repoOptions:      The repository options
     */
    async bootstrapIndividualHeaderAccounts(accountingEntity, repoOptions) {
      const {
        ownerId,
        id: accountingEntityId,

        functionalCurrency,
      } = accountingEntity;
      const revenueAccounts: TEntityWithEvents<
        IRevenueLedgerAccount,
        IRevenueLedgerAccount
      >[] = [];

      const servicesCode = REVENUE_LEDGER_CODES.SERVICES.HEADER;
      const employmentIncomeCode =
        REVENUE_LEDGER_CODES.EMPLOYMENT_INCOME.HEADER;
      const gainOnAssetSaleCode =
        REVENUE_LEDGER_CODES.GAIN_ON_ASSET_SALE.HEADER;
      const unrealizedGainCode = REVENUE_LEDGER_CODES.UNREALIZED_GAINS.HEADER;

      /**
       * Services
       */
      const existingServices = await repo.findByCode(
        servicesCode,
        accountingEntityId,
        repoOptions
      );
      if (!existingServices) {
        const servicesAccount = servicesAccountEntity.make(
          {
            name: 'Services',
            createdBy: ownerId,
            accountingEntityId,

            currency: functionalCurrency,
            isControlAccount: true,
            controlAccountId: null,
            meta: null,
          },
          null
        );
        revenueAccounts.push(servicesAccount);
      }

      /**
       * Employment Income
       */
      const existingEmploymentIncome = await repo.findByCode(
        employmentIncomeCode,
        accountingEntityId,
        repoOptions
      );
      if (!existingEmploymentIncome) {
        const employmentIncomeAccount = employmentIncomeAccountEntity.make(
          {
            name: 'Employment Income',
            createdBy: ownerId,
            accountingEntityId,

            currency: functionalCurrency,
            isControlAccount: true,
            controlAccountId: null,
            meta: null,
          },
          null
        );
        revenueAccounts.push(employmentIncomeAccount);
      }

      /**
       * Gain on Sale of Assets
       */
      const existingGainOnAssetSaleOfAssets = await repo.findByCode(
        gainOnAssetSaleCode,
        accountingEntityId,
        repoOptions
      );
      if (!existingGainOnAssetSaleOfAssets) {
        const GainOnAssetSaleOfAssetsAccount =
          GainOnAssetSaleAccountEntity.make(
            {
              name: 'Gain on Sale of Assets',
              createdBy: ownerId,
              accountingEntityId,

              currency: functionalCurrency,
              isControlAccount: true,
              controlAccountId: null,
              meta: null,
            },
            null
          );
        revenueAccounts.push(GainOnAssetSaleOfAssetsAccount);
      }

      /**
       * Unrealized Gain
       */
      const existingUnrealizedGain = await repo.findByCode(
        unrealizedGainCode,
        accountingEntityId,
        repoOptions
      );
      if (!existingUnrealizedGain) {
        const unrealizedGainAccount = unrealizedGainAccountEntity.make(
          {
            name: 'Unrealized Gain',
            createdBy: ownerId,
            accountingEntityId,

            currency: functionalCurrency,
            isControlAccount: true,
            controlAccountId: null,
            meta: null,
          },
          null
        );
        revenueAccounts.push(unrealizedGainAccount);
      }

      return revenueAccounts;
    },

    /**
     * Sets up the following posting revenue accounts for a non-power user:
     * - Services (Default)
     * - Employment Income (Default)
     * - Gain on Sale of Assets (Default)
     * - Unrealized Gains (Default)
     * @param accountingEntity: The individual entity account
     * @param repoOptions:      The repository options
     */
    async bootstrapIndividualPostingAccounts(accountingEntity, repoOptions) {
      const {
        ownerId,
        id: accountingEntityId,

        functionalCurrency,
      } = accountingEntity;
      const revenueAccounts: TEntityWithEvents<
        IRevenueLedgerAccount,
        IRevenueLedgerAccount
      >[] = [];

      /**
       * Services (Default)
       */
      const servicesControlCode = REVENUE_LEDGER_CODES.SERVICES.HEADER;
      const {
        canBootstrap: canBootstrapServices,
        controlAccount: servicesControl,
      } = await canBootstrapPostingAccount(
        {
          accountingEntityId,
          type: ELedgerType.Revenue,
          subType: ERevenueSubType.Services,
          controlLedgerCode: servicesControlCode,
        },
        repo,
        repoOptions
      );

      if (canBootstrapServices) {
        const account = servicesAccountEntity.make(
          {
            name: 'Services (Default)',
            createdBy: ownerId,
            accountingEntityId,

            currency: functionalCurrency,
            isControlAccount: false,
            controlAccountId: servicesControl.id,
            meta: null,
          },
          {
            precedingCode: servicesControl.code as TServicesLedgerCode,
            parentMaterializedPath:
              servicesControl.materializedPath as TServicesLedgerCode,
          }
        );
        revenueAccounts.push(account);
      }

      /**
       * Employment Income (Default)
       */
      const employmentControlCode =
        REVENUE_LEDGER_CODES.EMPLOYMENT_INCOME.HEADER;
      const { canBootstrap: canBootstrapEmp, controlAccount: empControl } =
        await canBootstrapPostingAccount(
          {
            accountingEntityId,
            type: ELedgerType.Revenue,
            subType: ERevenueSubType.EmploymentIncome,
            controlLedgerCode: employmentControlCode,
          },
          repo,
          repoOptions
        );

      if (canBootstrapEmp) {
        const account = employmentIncomeAccountEntity.make(
          {
            name: 'Employment Income (Default)',
            createdBy: ownerId,
            accountingEntityId,

            currency: functionalCurrency,
            isControlAccount: false,
            controlAccountId: empControl.id,
            meta: null,
          },
          {
            precedingCode: empControl.code as TEmploymentIncomeLedgerCode,
            parentMaterializedPath:
              empControl.materializedPath as TEmploymentIncomeLedgerCode,
          }
        );
        revenueAccounts.push(account);
      }

      /**
       * Gain on Sale of Assets (Default)
       */
      const gainOnAssetsControlCode =
        REVENUE_LEDGER_CODES.GAIN_ON_ASSET_SALE.HEADER;
      const { canBootstrap: canBootstrapGain, controlAccount: gainControl } =
        await canBootstrapPostingAccount(
          {
            accountingEntityId,
            type: ELedgerType.Revenue,
            subType: ERevenueSubType.GainOnAssetSale,
            controlLedgerCode: gainOnAssetsControlCode,
          },
          repo,
          repoOptions
        );

      if (canBootstrapGain) {
        const account = GainOnAssetSaleAccountEntity.make(
          {
            name: 'Gain on Sale of Assets (Default)',
            createdBy: ownerId,
            accountingEntityId,

            currency: functionalCurrency,
            isControlAccount: false,
            controlAccountId: gainControl.id,
            meta: null,
          },
          {
            precedingCode: gainControl.code as TGainOnAssetSaleLedgerCode,
            parentMaterializedPath:
              gainControl.materializedPath as TGainOnAssetSaleLedgerCode,
          }
        );
        revenueAccounts.push(account);
      }

      /**
       * Unrealized Gains (Default)
       */
      const unrealizedGainsControlCode =
        REVENUE_LEDGER_CODES.UNREALIZED_GAINS.HEADER;
      const {
        canBootstrap: canBootstrapUnrealized,
        controlAccount: unrealizedControl,
      } = await canBootstrapPostingAccount(
        {
          accountingEntityId,
          type: ELedgerType.Revenue,
          subType: ERevenueSubType.UnrealizedGains,
          controlLedgerCode: unrealizedGainsControlCode,
        },
        repo,
        repoOptions
      );

      if (canBootstrapUnrealized) {
        const account = unrealizedGainAccountEntity.make(
          {
            name: 'Unrealized Gains (Default)',
            createdBy: ownerId,
            accountingEntityId,

            currency: functionalCurrency,
            isControlAccount: false,
            controlAccountId: unrealizedControl.id,
            meta: null,
          },
          {
            precedingCode: unrealizedControl.code as TUnrealizedGainLedgerCode,
            parentMaterializedPath:
              unrealizedControl.materializedPath as TUnrealizedGainLedgerCode,
          }
        );
        revenueAccounts.push(account);
      }

      return revenueAccounts;
    },
  };

  return Object.freeze(service);
}
