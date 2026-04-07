import { IEvent } from '../../../shared/types/event.types';
import IReporter from '../../contracts/infra/reporter.contract';
import ILedgerAccountRepo from '../../../domain/ledger/repos/ledger-account.repo';
import { IAccountingEntity } from '../../../domain/accounting/types/accounting.types';
import { EAccountingEntityEvents } from '../../../domain/accounting/events/accounting-entity.events';
import eventValue from '../../../shared/value-objects/event.vo';
import IRequestContext from '../../contracts/app/request-context.contract';
import setupIndividualEntityBaseAccountsUseCase from '../../usecases/ledger-account/setup-individual-entity-base-accounts.usecase';
import IAccountingEntityRepo from '../../../domain/accounting/repos/accounting-entity.repo';
import IEventBus from '../../contracts/infra/event-bus.contract';

export default function accountingEntityCreatedEventHandler(
  reporter: IReporter,
  ledgerAccountRepo: ILedgerAccountRepo,
  requestContext: IRequestContext,
  accountingEntityRepo: IAccountingEntityRepo,
  eventBus: IEventBus
) {
  return async (event: IEvent<IAccountingEntity>) => {
    try {
      eventValue.validateEventTypeMatch(event, EAccountingEntityEvents.Created);
      const { correlationId: defaultCorrelationId } = requestContext.get();

      requestContext.set({
        correlationId: event.correlationId || defaultCorrelationId,
      });

      const setupBaseAccounts = setupIndividualEntityBaseAccountsUseCase(
        requestContext,
        ledgerAccountRepo,
        accountingEntityRepo,
        eventBus
      );

      await setupBaseAccounts(event.data.id);
    } catch (error) {
      reporter.report(error);
    }
  };
}
