import eventValue from '../../../shared/events/event.vo';
import { IReportingContext } from '../types/context.types';

export const EReportingContextEvents = {
  Created: 'domain:accounting:reporting-context:created',
} as const;

function makeCreatedEvent(params: IReportingContext) {
  return eventValue.make<IReportingContext>({
    type: EReportingContextEvents.Created,
    data: params,
  });
}

const reportingContextEvents = Object.freeze({
  created: makeCreatedEvent,
});

export default reportingContextEvents;
