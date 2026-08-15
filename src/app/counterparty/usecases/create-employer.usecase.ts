import IEventBus from '@shared/contracts/event-bus.contract';
import zodValidationRunner from '@shared/utils/zod-validation-runner';
import addressValue from '@shared/values/contact-details/address.vo';
import eventValue from '@shared/values/events/event.vo';
import { IEvent } from '@shared/values/events/types/event.types';
import historyValue from '@shared/values/history/history.vo';

import ICounterpartyService from '@domain/counterparty/types/counterparty.service.types';

import IAppContext from '@app/context/contracts/app-context.contract';
import ICounterpartyPersistenceService from '@app/counterparty/contracts/persistence.service.contract';
import { ICounterpartyDto } from '@app/counterparty/dtos/counterparty/counterparty.dto';
import counterpartyDtoMapper from '@app/counterparty/dtos/counterparty/counterparty.dto.mapper';
import { IEmployerCreateReq } from '@app/counterparty/dtos/employer/employer.dto';
import { employerCreateReqValidation } from '@app/counterparty/dtos/employer/employer.dto.validation';

interface IDependencies {
  appContext: IAppContext;
  counterpartyService: ICounterpartyService;
  counterpartyPersistenceService: ICounterpartyPersistenceService;
  eventBus: IEventBus;
}

export default function makeCreateEmployerUsecase(deps: IDependencies) {
  return async (payload: IEmployerCreateReq): Promise<ICounterpartyDto> => {
    zodValidationRunner(employerCreateReqValidation, payload);

    const { correlationId, idempotencyKey, user, accountingEntity } =
      deps.appContext.get();

    const counterpartyPayload = {
      accountingEntityId: accountingEntity.id,
      name: payload.name,
      type: payload.type,
      status: payload.status,
    };

    const employerDetails = {
      displayName: payload.displayName ?? null,
      address: addressValue.make(payload.address),
    };

    const creation = deps.counterpartyService.createEmployer(
      counterpartyPayload,
      employerDetails
    );

    const [counterparty, counterpartyEvents, counterpartyAudit] =
      creation.counterparty;
    const [employer, employerEvents, employerAudit] = creation.employer;

    const actor = historyValue.getUserActor(user.id);
    const counterpartyHistory = historyValue.make(
      counterpartyAudit,
      actor,
      correlationId
    );
    const employerHistory = historyValue.make(
      employerAudit,
      actor,
      correlationId
    );

    await deps.counterpartyPersistenceService.createEmployer(
      counterparty,
      employer,
      {
        correlationId,
        history: [counterpartyHistory, employerHistory],
      }
    );

    const repoOptions = { correlationId, idempotencyKey };
    const events: IEvent<unknown>[] = [
      ...counterpartyEvents,
      ...employerEvents,
    ];
    const enrichedEvents = eventValue.enrichAll(events, repoOptions);
    await deps.eventBus.publish(enrichedEvents);

    return counterpartyDtoMapper.toDto(counterparty);
  };
}
