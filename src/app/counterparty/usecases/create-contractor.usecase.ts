import IEventBus from '@shared/contracts/event-bus.contract';
import zodValidationRunner from '@shared/utils/zod-validation-runner';
import addressValue from '@shared/values/contact-details/address.vo';
import eventValue from '@shared/values/events/event.vo';
import { IEvent } from '@shared/values/events/types/event.types';
import historyValue from '@shared/values/history/history.vo';

import ICounterpartyService from '@domain/counterparty/types/counterparty.service.types';

import IAppContext from '@app/context/contracts/app-context.contract';
import ICounterpartyPersistenceService from '@app/counterparty/contracts/persistence.service.contract';
import { IContractorCreateReq } from '@app/counterparty/dtos/contractor/contractor.dto';
import { contractorCreateReqValidation } from '@app/counterparty/dtos/contractor/contractor.dto.validation';
import { ICounterpartyDto } from '@app/counterparty/dtos/counterparty/counterparty.dto';
import counterpartyDtoMapper from '@app/counterparty/dtos/counterparty/counterparty.dto.mapper';

interface IDependencies {
  appContext: IAppContext;
  counterpartyService: ICounterpartyService;
  counterpartyPersistenceService: ICounterpartyPersistenceService;
  eventBus: IEventBus;
}

export default function makeCreateContractorUsecase(deps: IDependencies) {
  return async (payload: IContractorCreateReq): Promise<ICounterpartyDto> => {
    zodValidationRunner(contractorCreateReqValidation, payload);

    const { correlationId, idempotencyKey, user, accountingEntity } =
      deps.appContext.get();

    const counterpartyPayload = {
      accountingEntityId: accountingEntity.id,
      name: payload.name,
      type: payload.type,
      status: payload.status,
    };

    const contractorDetails = {
      address: addressValue.make(payload.address),
    };

    const creation = deps.counterpartyService.createContractor(
      counterpartyPayload,
      contractorDetails
    );

    const [counterparty, counterpartyEvents, counterpartyAudit] =
      creation.counterparty;
    const [contractor, contractorEvents, contractorAudit] = creation.contractor;

    const actor = historyValue.getUserActor(user.id);
    const counterpartyHistory = historyValue.make(
      counterpartyAudit,
      actor,
      correlationId
    );
    const contractorHistory = historyValue.make(
      contractorAudit,
      actor,
      correlationId
    );

    await deps.counterpartyPersistenceService.createContractor(
      counterparty,
      contractor,
      {
        correlationId,
        history: [counterpartyHistory, contractorHistory],
      }
    );

    const trace = { correlationId, idempotencyKey };
    const events: IEvent<unknown>[] = [
      ...counterpartyEvents,
      ...contractorEvents,
    ];
    const enrichedEvents = eventValue.enrichAll(events, trace);
    await deps.eventBus.publish(enrichedEvents);

    return counterpartyDtoMapper.toDto(counterparty);
  };
}
