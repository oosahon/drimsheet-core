import IAccountingEntityRepo from '../../../domain/accounting/repos/accounting-entity.repo';
import accountingEntityService from '../../../domain/accounting/services/accounting-entity.service';
import { IAccountingEntity } from '../../../domain/accounting/types/accounting.types';
import IUserPreferencesRepo from '../../../domain/user/repos/user-preferences.repo';
import userPreferencesService from '../../../domain/user/services/user-preferences.service';
import { IUserPreferences } from '../../../domain/user/types/user-preferences.types';
import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import {
  ErrorResourceNotFound,
  ErrorUnauthorized,
} from '../../../shared/value-objects/error';
import eventValue from '../../../shared/value-objects/event.vo';
import IRequestContext from '../../contracts/app/request-context.contract';
import { IAccountingEntityOnboardingReq } from '../../contracts/dto/onboarding.dto';
import IEventBus from '../../contracts/infra/event-bus.contract';
import { IRepoService } from '../../contracts/infra/repo.contract';
import currencyMapper from '../../mappers/currency.mapper';

export default function onboardAccountingEntityUseCase(
  requestContext: IRequestContext,
  accountingEntityRepo: IAccountingEntityRepo,
  userPreferencesRepo: IUserPreferencesRepo,
  repoService: IRepoService,
  eventBus: IEventBus
) {
  const accountingEntityServiceFn =
    accountingEntityService(accountingEntityRepo);

  const userPreferencesServiceFn = userPreferencesService(userPreferencesRepo);

  return async (payload: IAccountingEntityOnboardingReq) => {
    const { functionalCurrencyCode, reportingCurrencyCode } = payload;
    const { user, correlationId } = requestContext.get();

    if (!user) {
      throw new ErrorUnauthorized();
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

    const accountingEntityCreatePayload: TCreationOmits<IAccountingEntity> = {
      type: payload.entityType,
      ownerId: user.id,
      functionalCurrency,
      reportingCurrency,
      fiscalYearStart: payload.fiscalYearStart,
    };
    const [accountingEntity, accountingEntityEvents] =
      await accountingEntityServiceFn.make(
        user.id,
        accountingEntityCreatePayload,
        correlationIdObj
      );

    const userPreferencesCreatePayload: Partial<IUserPreferences> = {
      appPreferences: {
        appUsageMode: payload.accountingMode,
      },
    };
    const [updatedPreference, preferencesEvents] =
      await userPreferencesServiceFn.update(
        user.id,
        userPreferencesCreatePayload,
        correlationIdObj
      );

    await repoService.runInTransaction(async (tx) => {
      const txOptions = { tx, ...correlationIdObj };
      await accountingEntityRepo.save(accountingEntity, txOptions);
      await userPreferencesRepo.save(updatedPreference, txOptions);
    });

    const events = [
      ...accountingEntityEvents.map((e) =>
        eventValue.enrich(e, correlationIdObj)
      ),
      ...preferencesEvents.map((e) => eventValue.enrich(e, correlationIdObj)),
    ];

    eventBus.publish(events);
  };
}
