import ledgerService from '../../../domain/ledger/services/ledger.service';
import { IEvent } from '../../../shared/types/event.types';
import { AppError } from '../../../shared/value-objects/error';
import IReporter from '../../contracts/infra/reporter.contract';
import ILedgerAccountRepo from '../../../domain/ledger/repos/ledger-account.repo';
import { IAccountingEntity } from '../../../domain/accounting/types/accounting.types';
import { IRepoService } from '../../contracts/infra/repo.contract';
import generateUUID from '../../../shared/utils/uuid-generator';
import { EAccountingEntityEvents } from '../../../domain/accounting/events/accounting-entity.events';

export default function accountingEntityCreatedEventHandler(
  reporter: IReporter,
  ledgerAccountRepo: ILedgerAccountRepo,
  repoService: IRepoService
) {
  return async (event: IEvent<IAccountingEntity>) => {
    try {
      const shouldHandler = event.type === EAccountingEntityEvents.Created;

      if (!shouldHandler) {
        throw new AppError(
          'Invalid event type passed to accounting entity created event handler',
          {
            cause: {
              type: event.type,
              correlationId: event.correlationId,
            },
          }
        );
      }

      await repoService.runInTransaction(async (tx) => {
        const ledgerServiceFn = ledgerService(ledgerAccountRepo);

        const correlationId = event.correlationId ?? generateUUID();

        const setupPayload = {
          userId: event.data.ownerId,
          accountingEntityId: event.data.id,
          functionalCurrency: event.data.functionalCurrency,
        };
        const repoParams = {
          tx,
          correlationId,
        };

        const entitiesAndEvents =
          await ledgerServiceFn.setupBaseIndividualAccounts(
            setupPayload,
            repoParams
          );

        for (const [entity, events] of entitiesAndEvents) {
          await ledgerAccountRepo.save(entity, repoParams);
          // TODO: publish events
        }
      });
    } catch (error) {
      reporter.report(error);
    }
  };
}
