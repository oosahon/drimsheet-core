import IAccountingEntityRepo from '../../../domain/accounting/repos/accounting-entity.repo';
import { EAccountingEntityType } from '../../../domain/accounting/types/accounting.types';
import ILedgerAccountRepo from '../../../domain/ledger/repos/ledger-account.repo';
import ledgerService from '../../../domain/ledger/services/ledger.service';
import { ILedgerAccount } from '../../../domain/ledger/types/ledger.types';
import { IEvent } from '../../../shared/types/event.types';
import { TEntityId } from '../../../shared/types/uuid';
import { AppError } from '../../../shared/value-objects/error';
import eventValue from '../../../shared/value-objects/event.vo';
import IRequestContext from '../../contracts/app/request-context.contract';
import IEventBus from '../../contracts/infra/event-bus.contract';

export default function setupIndividualEntityBaseAccountsUseCase(
  requestContext: IRequestContext,
  ledgerAccountRepo: ILedgerAccountRepo,
  accountingEntityRepo: IAccountingEntityRepo,
  eventBus: IEventBus
) {
  return async (accountingEntityId: TEntityId) => {
    const { correlationId } = requestContext.get();

    const accountingEntity = await accountingEntityRepo.findById(
      accountingEntityId,
      { correlationId }
    );

    if (!accountingEntity) {
      throw new AppError('Accounting entity not found', {
        cause: { accountingEntityId },
      });
    }

    if (accountingEntity.type !== EAccountingEntityType.Individual) {
      throw new AppError('Accounting entity type is not individual', {
        cause: { accountingEntityId },
      });
    }

    const setupPayload = {
      userId: accountingEntity.ownerId,
      accountingEntityId: accountingEntity.id,
      functionalCurrency: accountingEntity.functionalCurrency,
    };

    const ledgerServiceFn = ledgerService(ledgerAccountRepo);

    const entitiesAndEvents = await ledgerServiceFn.setupBaseIndividualAccounts(
      setupPayload,
      { correlationId }
    );

    const entities: ILedgerAccount[] = [];
    const entityEvents: IEvent<ILedgerAccount>[] = [];

    entitiesAndEvents.forEach(([entity, events]) => {
      entities.push(entity);
      entityEvents.push(...events);
    });

    if (entities.length > 0) {
      await ledgerAccountRepo.save(entities, { correlationId });
    }

    const enrichedEvents = entityEvents.map((event) =>
      eventValue.enrich(event, { correlationId })
    );

    eventBus.publish(enrichedEvents);
  };
}
