import IAccountingEntityRepo from '../../../domain/accounting-entity/repos/accounting-entity.repo';
import accountingEntityService from '../../../domain/accounting-entity/services/accounting-entity.service';
import {
  EAccountingEntityType,
  IAccountingEntity,
} from '../../../domain/accounting-entity/types/accounting-entity.types';
import ILedgerAccountRepo from '../../../domain/ledger/repos/ledger-account.repo';
import ledgerService from '../../../domain/ledger/services/ledger.service';
import { ILedgerAccount } from '../../../domain/ledger/types/ledger.types';
import IUserPreferencesRepo from '../../../domain/user/repos/user-preferences.repo';
import userPreferencesService from '../../../domain/user/services/user-preferences.service';
import {
  EAppUsageModePreference,
  IUserPreferences,
} from '../../../domain/user/types/user-preferences.types';
import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import { IEvent, TEntityWithEvents } from '../../../shared/types/event.types';
import {
  ErrorBadRequest,
  ErrorResourceNotFound,
  ErrorUnauthorized,
} from '../../../shared/value-objects/error';
import eventValue from '../../../shared/value-objects/event.vo';
import IRequestContext from '../../contracts/app/request-context.contract';
import { IAccountingEntityOnboardingReq } from '../../contracts/dto/onboarding.dto';
import IEventBus from '../../contracts/infra/event-bus.contract';
import { IRepoService } from '../../contracts/infra/repo.contract';
import currencyMapper from '../../mappers/currency.mapper';
import { z } from 'zod';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import accountingEntitySupportedCountries from '../../../domain/accounting-entity/config/supported-countries.config';
import accountingEntityEvents from '../../../domain/accounting-entity/events/accounting-entity.events';

const validationSchema = z.object({
  name: z.string(),
  operatingCountryCode: z.enum(
    accountingEntitySupportedCountries.map((v) => v.code),
    'Unsupported operating country code'
  ),
  entityType: z.enum([EAccountingEntityType.Individual]),
  functionalCurrencyCode: z.string().length(3),
  reportingCurrencyCode: z.string().length(3),
  fiscalYearStart: z.object({
    month: z.number().min(1).max(12),
    day: z.number().min(1).max(31),
  }),
});

export default function onboardAccountingEntityUseCase(
  requestContext: IRequestContext,
  accountingEntityRepo: IAccountingEntityRepo,
  userPreferencesRepo: IUserPreferencesRepo,
  ledgerAccountRepo: ILedgerAccountRepo,
  repoService: IRepoService,
  eventBus: IEventBus
) {
  return async (payload: IAccountingEntityOnboardingReq) => {
    zodValidationRunner(validationSchema, payload);

    const accountingEntityServiceFn =
      accountingEntityService(accountingEntityRepo);
    const userPreferencesServiceFn =
      userPreferencesService(userPreferencesRepo);
    const ledgerServiceFn = ledgerService(ledgerAccountRepo);

    const { functionalCurrencyCode, reportingCurrencyCode } = payload;
    const { user, correlationId } = requestContext.get();

    if (!user) {
      throw new ErrorUnauthorized();
    }

    // !! We only support individuals for now
    if (payload.entityType !== EAccountingEntityType.Individual) {
      throw new ErrorBadRequest('This entity type is not currently supported');
    }

    const functionalCurrency = currencyMapper.fromInterface(
      functionalCurrencyCode
    );
    const reportingCurrency = currencyMapper.fromInterface(
      reportingCurrencyCode
    );

    if (!functionalCurrency || !reportingCurrency) {
      throw new ErrorResourceNotFound(`Currency not found`, {
        cause: { correlationId, functionalCurrencyCode, reportingCurrencyCode },
      });
    }

    const correlationIdObj = {
      correlationId,
    };

    /**
     * Create accounting entity
     */
    const accountingEntityCreatePayload: TCreationOmits<IAccountingEntity> = {
      name: payload.name,
      operatingCountryCode: payload.operatingCountryCode,
      type: payload.entityType,
      ownerId: user.id,
      functionalCurrency,
      reportingCurrency,
      fiscalYearStart: payload.fiscalYearStart,
    };
    const [accountingEntity, createdAccountingEntityEvents] =
      await accountingEntityServiceFn.make(
        user.id,
        accountingEntityCreatePayload,
        correlationIdObj
      );

    /**
     * Setup base accounts
     */

    const baseGlAccountsWithEvents =
      await ledgerServiceFn.setupBaseIndividualAccounts(
        accountingEntity,
        correlationIdObj
      );

    const baseGlAccounts: ILedgerAccount[] = [];
    const baseGlAccountEvents: IEvent<ILedgerAccount>[] = [];

    baseGlAccountsWithEvents.forEach(([account, events]) => {
      baseGlAccounts.push(account);
      baseGlAccountEvents.push(...events);
    });

    /**
     * Create user preferences
     */
    const userPreferencesCreatePayload: Partial<IUserPreferences> = {
      appPreferences: {
        appUsageMode: payload.appUsageMode,
      },
    };
    const [updatedPreference, preferencesEvents] =
      await userPreferencesServiceFn.update(
        user.id,
        userPreferencesCreatePayload,
        correlationIdObj
      );

    /**
     * Save all entities in the right order
     */
    await repoService.runInTransaction(async (tx) => {
      const txOptions = { tx, ...correlationIdObj };
      // step 1: save accounting entity
      await accountingEntityRepo.save(accountingEntity, txOptions);

      // step 2: save base accounts
      await ledgerAccountRepo.save(baseGlAccounts, txOptions);

      // step 3: save user preferences
      await userPreferencesRepo.save(updatedPreference, txOptions);
    });

    /**
     * Publish events
     */
    const events = [
      ...createdAccountingEntityEvents.map((e) =>
        eventValue.enrich(e, correlationIdObj)
      ),
      ...baseGlAccountEvents.map((e) => eventValue.enrich(e, correlationIdObj)),
      ...preferencesEvents.map((e) => eventValue.enrich(e, correlationIdObj)),
    ];
    eventBus.publish(events);

    if (payload.appUsageMode === EAppUsageModePreference.NonPowerUser) {
      eventBus.publish(
        accountingEntityEvents.bootstrapIndividualPostingAccounts(
          accountingEntity
        )
      );
    }
  };
}
