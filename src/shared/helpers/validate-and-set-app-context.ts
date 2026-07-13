import IAppContext from '../contracts/app-context.contract';
import eventValue from '../events/event.vo';
import { IEvent } from '../events/types/event.types';
import generateUUID from '../utils/uuid-generator';

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
