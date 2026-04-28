import { IAccountingEntity } from '../../../../domain/accounting/types/accounting-entity.types';
import currencyEntity from '../../../../domain/currency/entities/currency.entity';
import { REVENUE_LEDGER_CODES } from '../../../../domain/ledger/config/revenue-codes.config';
import servicesAccountEntity from '../../../../domain/ledger/entities/04-revenue-account/02-services.entity';
import employmentIncomeAccountEntity from '../../../../domain/ledger/entities/04-revenue-account/04-employment-income.entity';
import GainOnAssetSaleAccountEntity from '../../../../domain/ledger/entities/04-revenue-account/06-gain-on-sale.entity';
import unrealizedGainAccountEntity from '../../../../domain/ledger/entities/04-revenue-account/07-unrealized-gain.entity';
import ILedgerAccountRepo from '../../../../domain/ledger/repos/ledger-account.repo';
import { TRevenueLedgerCode } from '../../../../domain/ledger/types/ledger-code.types';
import { IRevenueLedgerAccount } from '../../../../domain/ledger/types/revenue-account.types';
import {
  IEvent,
  TEntityWithEvents,
} from '../../../../shared/types/event.types';
import IRequestContext from '../../../contracts/app/request-context.contract';

export default function makeSetupRevenueHeaderAccountsUseCase(
  requestContext: IRequestContext,
  ledgerAccountRepo: ILedgerAccountRepo
) {
  /**
   * Sets up the following revenue accounts for an individual:
   *  - Services:                401000
   *  - Employment Income:       403000
   *  - Gain on Sale of Assets:  405000
   *  - Unrealized Gain:         406000
   */
  return async (accountingEntity: IAccountingEntity) => {
    const { user, correlationId } = requestContext.get();
    const accountingEntityId = accountingEntity.id;
    const createdBy = user.id;
    const functionalCurrency = currencyEntity.getByCode(
      accountingEntity.functionalCurrencyCode
    );

    const trace = { correlationId };

    const getExistingAccounts = async <T extends IRevenueLedgerAccount>(
      code: TRevenueLedgerCode
    ) => {
      return (await ledgerAccountRepo.findByCode(
        code,
        accountingEntityId,
        trace
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
}
