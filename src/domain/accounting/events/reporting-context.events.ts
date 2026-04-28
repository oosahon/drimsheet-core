import eventValue from '../../../shared/value-objects/event.vo';
import { IReportingContext } from '../types/context.types';

export const EReportingContextEvents = {
  Created: 'domain:accounting:reporting-context:created',
} as const;

export const reportingContextEventDescriptions: Record<string, string> = {
  [EReportingContextEvents.Created]: 'Created a reporting context.',
};

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
