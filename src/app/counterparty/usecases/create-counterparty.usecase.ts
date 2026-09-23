import IEventBus from '@shared/contracts/event-bus.contract';
import zodValidationRunner from '@shared/utils/zod-validation-runner';
import eventValue from '@shared/values/events/event.vo';
import historyValue from '@shared/values/history/history.vo';

import ICounterpartyRepo from '@domain/counterparty/repos/counterparty.repo';
import ICounterpartyService from '@domain/counterparty/types/counterparty.service.types';

import IAppContext from '@app/context/contracts/app-context.contract';
import {
  ICounterpartyCreateReq,
  ICounterpartyDto,
} from '@app/counterparty/dtos/counterparty/counterparty.dto';
import counterpartyDtoMapper from '@app/counterparty/dtos/counterparty/counterparty.dto.mapper';
import { counterpartyCreateReqValidation } from '@app/counterparty/dtos/counterparty/counterparty.dto.validation';

interface IDependencies {
  appContext: IAppContext;
  counterpartyService: ICounterpartyService;
  counterpartyRepo: ICounterpartyRepo;
  eventBus: IEventBus;
}

export default function makeCreateCounterpartyUsecase(deps: IDependencies) {
  return async (payload: ICounterpartyCreateReq): Promise<ICounterpartyDto> => {
    zodValidationRunner(counterpartyCreateReqValidation, payload);

    const { correlationId, idempotencyKey, user, accountingEntity } =
      deps.appContext.get(['user', 'accountingEntity']);

    const creationPayload = counterpartyDtoMapper.fromDto(
      payload,
      accountingEntity.id
    );
    const creation = deps.counterpartyService.create(creationPayload);
    const [counterparty, events, audit] = creation;

    const actor = historyValue.getUserActor(user.id);
    const history = historyValue.make(audit, actor, correlationId);

    await deps.counterpartyRepo.create(counterparty, {
      correlationId,
      history,
    });

    const repoOptions = { correlationId, idempotencyKey };
    const enrichedEvents = eventValue.enrichAll(events, repoOptions);
    await deps.eventBus.publish(enrichedEvents);

    return counterpartyDtoMapper.toDto(counterparty);
  };
}
