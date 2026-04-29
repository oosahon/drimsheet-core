import { IEvent, TEntityWithEvents } from '../../../shared/types/event.types';
import currencyEntity from '../../currency/entities/currency.entity';
import { REVENUE_LEDGER_CODES } from '../config/revenue-codes.config';
import servicesAccountEntity from '../entities/04-revenue-account/02-services.entity';
import employmentIncomeAccountEntity from '../entities/04-revenue-account/04-employment-income.entity';
import GainOnAssetSaleAccountEntity from '../entities/04-revenue-account/06-gain-on-sale.entity';
import unrealizedGainAccountEntity from '../entities/04-revenue-account/07-unrealized-gain.entity';
import ILedgerAccountRepo from '../repos/ledger-account.repo';
import { TRevenueLedgerCode } from '../types/ledger-code.types';
import IRevenueAccountService from '../types/revenue-account.service.types';
import { IRevenueLedgerAccount } from '../types/revenue-account.types';

type TBootstrapHeaders = IRevenueAccountService['bootstrapHeaderAccounts'];

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
    repoOptions
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

    if (!existingServices) {
      const servicesAccount = servicesAccountEntity.makeHeader({
        ...basePayload,
        name: 'Services',
      });
      allAccounts.push(servicesAccount);
    }

    /**
     * ==================== Employment Income ====================
     */
    const employmentIncomeCode = REVENUE_LEDGER_CODES.EMPLOYMENT_INCOME.HEADER;
    const existingEmploymentIncome =
      await getExistingAccounts(employmentIncomeCode);

    if (!existingEmploymentIncome) {
      const employmentIncomeAccount = employmentIncomeAccountEntity.makeHeader({
        ...basePayload,
        name: 'Employment Income',
      });
      allAccounts.push(employmentIncomeAccount);
    }

    /**
     * ==================== Gain on Sale of Assets ====================
     */
    const gainOnAssetSaleCode = REVENUE_LEDGER_CODES.GAIN_ON_ASSET_SALE.HEADER;
    const existingGainOnAssetSaleOfAssets =
      await getExistingAccounts(gainOnAssetSaleCode);

    if (!existingGainOnAssetSaleOfAssets) {
      const GainOnAssetSaleOfAssetsAccount =
        GainOnAssetSaleAccountEntity.makeHeader({
          ...basePayload,
          name: 'Gain on Sale of Assets',
        });
      allAccounts.push(GainOnAssetSaleOfAssetsAccount);
    }

    /**
     * ==================== Unrealized Gain ====================
     */
    const unrealizedGainCode = REVENUE_LEDGER_CODES.UNREALIZED_GAINS.HEADER;
    const existingUnrealizedGain =
      await getExistingAccounts(unrealizedGainCode);

    if (!existingUnrealizedGain) {
      const unrealizedGainAccount = unrealizedGainAccountEntity.makeHeader({
        ...basePayload,
        name: 'Unrealized Gain',
      });
      allAccounts.push(unrealizedGainAccount);
    }

    const accounts: IRevenueLedgerAccount[] = [];
    const events: IEvent<IRevenueLedgerAccount>[] = [];

    for (const [account, accountEvents] of allAccounts) {
      accounts.push(account);
      events.push(...accountEvents);
    }

    return { accounts, events };
  };

  return Object.freeze({
    bootstrapHeaderAccounts,
  });
}
