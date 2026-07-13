import eventValue from '../../../shared/events/event.vo';
import { IEvent } from '../../../shared/events/types/event.types';
import generateUUID from '../../../shared/utils/uuid-generator';
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
