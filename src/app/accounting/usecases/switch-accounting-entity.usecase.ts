import IEventBus from '@shared/contracts/event-bus.contract';
import { TEntityId } from '@shared/types/uuid';
import zodValidationRunner from '@shared/utils/zod-validation-runner';
import eventValue from '@shared/values/events/event.vo';

import { IAccountingEntitySwitchReq } from '@app/accounting/dtos/accounting/accounting.dto';
import { accountingEntitySwitchReqSchema } from '@app/accounting/dtos/accounting/accounting.dto.validation';
import IAppContext from '@app/context/contracts/app-context.contract';
import IUserPreferencesAppService from '@app/user/contracts/user-preferences-app.service.contract';

interface IDependencies {
  appContext: IAppContext;
  userPreferencesAppService: IUserPreferencesAppService;
  eventBus: IEventBus;
}

export default function makeSwitchAccountingEntityUsecase(deps: IDependencies) {
  return async (payload: IAccountingEntitySwitchReq) => {
    zodValidationRunner(accountingEntitySwitchReqSchema, payload);

    const { user, correlationId } = deps.appContext.get();

    const preferenceUpdate =
      await deps.userPreferencesAppService.setActiveAccountingEntity(
        user.id,
        payload.accountingEntityId as TEntityId,
        { correlationId }
      );
    const { accountingEntity } = preferenceUpdate;

    deps.appContext.set({ accountingEntity });

    const enrichedEvents = eventValue.enrichAll<unknown>(
      [...preferenceUpdate.events],
      { correlationId }
    );

    await deps.eventBus.publish(enrichedEvents);

    return accountingEntity;
  };
}
