import IEventBus from '@shared/contracts/event-bus.contract';
import zodValidationRunner from '@shared/utils/zod-validation-runner';
import eventValue from '@shared/values/events/event.vo';
import historyValue from '@shared/values/history/history.vo';

import ICounterpartyService from '@domain/counterparty/types/counterparty.service.types';

import IAppContext from '@app/context/contracts/app-context.contract';
import ICounterpartyPersistenceService from '@app/counterparty/contracts/persistence.service.contract';
import {
  ICounterpartyCreateReq,
  ICounterpartyDto,
} from '@app/counterparty/dtos/counterparty/counterparty.dto';
import counterpartyDtoMapper from '@app/counterparty/dtos/counterparty/counterparty.dto.mapper';
import { counterpartyCreateReqValidation } from '@app/counterparty/dtos/counterparty/counterparty.dto.validation';

interface IDependencies {
  appContext: IAppContext;
  counterpartyService: ICounterpartyService;
  counterpartyPersistenceService: ICounterpartyPersistenceService;
  eventBus: IEventBus;
}

export default function makeCreateCounterpartyUsecase(deps: IDependencies) {
  return async (payload: ICounterpartyCreateReq): Promise<ICounterpartyDto> => {
    zodValidationRunner(counterpartyCreateReqValidation, payload);

    const { correlationId, idempotencyKey, user, accountingEntity } =
      deps.appContext.get();

    const [counterparty, events, audit] = deps.counterpartyService.create({
      accountingEntityId: accountingEntity.id,
      name: payload.name,
      type: payload.type,
      status: payload.status,
    });

    const actor = historyValue.getUserActor(user.id);
    const history = historyValue.make(audit, actor, correlationId);

    await deps.counterpartyPersistenceService.create(counterparty, {
      correlationId,
      history,
    });

    const trace = { correlationId, idempotencyKey };
    const enrichedEvents = eventValue.enrichAll(events, trace);
    await deps.eventBus.publish(enrichedEvents);

    return counterpartyDtoMapper.toDto(counterparty);
  };
}
