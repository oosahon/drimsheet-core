import generateUUID from '../../../shared/utils/uuid-generator';
import eventValue from '../../../shared/values/events/event.vo';
import { IEvent } from '../../../shared/values/events/types/event.types';
import IAppContext from '../contracts/app-context.contract';

export default function validateEventAndSetAppContext(
  appContext: IAppContext,
  event: IEvent<unknown>,
  eventType: string
) {
  eventValue.validateEventTypeMatch(event, eventType);
  const correlationId = event.correlationId || generateUUID();
  appContext.set({ correlationId });
  return correlationId;
}
