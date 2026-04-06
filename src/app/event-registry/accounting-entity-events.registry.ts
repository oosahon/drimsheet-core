import { EAccountingEntityEvents } from '../../domain/accounting/events/accounting-entity.events';
import accountingEntityEventHandlers from '../handlers/accounting-entity';

const accountingEntityEventsRegistry = {
  [EAccountingEntityEvents.Created]: accountingEntityEventHandlers.created,
};

export default accountingEntityEventsRegistry;
