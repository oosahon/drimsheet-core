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
import { IVendorCreateReq } from '@app/counterparty/dtos/vendor/vendor.dto';
import { vendorCreateReqValidation } from '@app/counterparty/dtos/vendor/vendor.dto.validation';

interface IDependencies {
  appContext: IAppContext;
  counterpartyService: ICounterpartyService;
  counterpartyPersistenceService: ICounterpartyPersistenceService;
  eventBus: IEventBus;
}

export default function makeCreateVendorUsecase(deps: IDependencies) {
  return async (payload: IVendorCreateReq): Promise<ICounterpartyDto> => {
    zodValidationRunner(vendorCreateReqValidation, payload);

    const { correlationId, idempotencyKey, user, accountingEntity } =
      deps.appContext.get();

    const counterpartyPayload = {
      accountingEntityId: accountingEntity.id,
      name: payload.name,
      type: payload.type,
      status: payload.status,
    };

    const vendorDetails = {
      address: payload.address ? addressValue.make(payload.address) : null,
    };

    const creation = deps.counterpartyService.createVendor(
      counterpartyPayload,
      vendorDetails
    );

    const [counterparty, counterpartyEvents, counterpartyAudit] =
      creation.counterparty;
    const [vendor, vendorEvents, vendorAudit] = creation.vendor;

    const actor = historyValue.getUserActor(user.id);
    const counterpartyHistory = historyValue.make(
      counterpartyAudit,
      actor,
      correlationId
    );
    const vendorHistory = historyValue.make(vendorAudit, actor, correlationId);

    await deps.counterpartyPersistenceService.createVendor(
      counterparty,
      vendor,
      {
        correlationId,
        history: [counterpartyHistory, vendorHistory],
      }
    );

    const trace = { correlationId, idempotencyKey };
    const events: IEvent<unknown>[] = [...counterpartyEvents, ...vendorEvents];
    const enrichedEvents = eventValue.enrichAll(events, trace);
    await deps.eventBus.publish(enrichedEvents);

    return counterpartyDtoMapper.toDto(counterparty);
  };
}
