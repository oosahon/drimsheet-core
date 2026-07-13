import IAppContext from '../contracts/app-context.contract';
import { IEvent } from '../types/event.types';
import eventValue from '../value-objects/event.vo';
import generateUUID from './uuid-generator';

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
