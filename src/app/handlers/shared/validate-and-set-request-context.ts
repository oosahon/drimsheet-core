import { IEvent } from '../../../shared/types/event.types';
import generateUUID from '../../../shared/utils/uuid-generator';
import eventValue from '../../../shared/value-objects/event.vo';
import IRequestContext from '../../contracts/app/request-context.contract';

export default function validateEventAndSetRequestContext(
  requestContext: IRequestContext,
  event: IEvent<unknown>,
  eventType: string
) {
  eventValue.validateEventTypeMatch(event, eventType);
  const correlationId = event.correlationId || generateUUID();
  requestContext.set({ correlationId });
  return correlationId;
}
