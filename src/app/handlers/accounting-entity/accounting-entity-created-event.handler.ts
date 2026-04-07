import { IEvent } from '../../../shared/types/event.types';
import IReporter from '../../contracts/infra/reporter.contract';
import { IAccountingEntity } from '../../../domain/accounting/types/accounting.types';
import { EAccountingEntityEvents } from '../../../domain/accounting/events/accounting-entity.events';
import eventValue from '../../../shared/value-objects/event.vo';
import IRequestContext from '../../contracts/app/request-context.contract';
import ledgerAccountUsecase from '../../usecases/ledger-account';

export default function accountingEntityCreatedEventHandler(
  reporter: IReporter,
  requestContext: IRequestContext
) {
  return async (event: IEvent<IAccountingEntity>) => {
    try {
      eventValue.validateEventTypeMatch(event, EAccountingEntityEvents.Created);
      const { correlationId: defaultCorrelationId } = requestContext.get();

      requestContext.set({
        correlationId: event.correlationId || defaultCorrelationId,
      });

      await ledgerAccountUsecase.setupIndividualEntityBaseAccounts(
        event.data.id
      );
    } catch (error) {
      reporter.report(error);
    }
  };
}
