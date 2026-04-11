import z from 'zod';
import { TEntityId } from '../../../shared/types/uuid';
import IRequestContext from '../../contracts/app/request-context.contract';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import ILedgerAccountRepo from '../../../domain/ledger/repos/ledger-account.repo';
import ledgerService from '../../../domain/ledger/services/ledger.service';
import IAccountingEntityRepo from '../../../domain/accounting-entity/repos/accounting-entity.repo';
import {
  ErrorBadRequest,
  ErrorResourceNotFound,
} from '../../../shared/value-objects/error';
import { EAccountingEntityType } from '../../../domain/accounting-entity/types/accounting-entity.types';
import { IEvent } from '../../../shared/types/event.types';
import { ILedgerAccount } from '../../../domain/ledger/types/ledger.types';
import IEventBus from '../../contracts/infra/event-bus.contract';
import eventValue from '../../../shared/value-objects/event.vo';

const validationSchema = z.object({
  accountingEntityId: z.uuid(),
});

export default function setupNonPowerUserPostingAccountsUseCase(
  requestContext: IRequestContext,
  ledgerAccountRepo: ILedgerAccountRepo,
  accountingEntityRepo: IAccountingEntityRepo,
  eventBus: IEventBus
) {
  return async (accountingEntityId: TEntityId) => {
    zodValidationRunner(validationSchema, { accountingEntityId });

    const { correlationId } = requestContext.get();

    const accountingEntity = await accountingEntityRepo.findById(
      accountingEntityId,
      { correlationId }
    );

    if (!accountingEntity) {
      throw new ErrorResourceNotFound('Accounting entity not found');
    }

    // !! We only support individuals for now
    if (accountingEntity.type !== EAccountingEntityType.Individual) {
      throw new ErrorBadRequest('This entity type is not currently supported');
    }

    const ledgerServiceFn = ledgerService(ledgerAccountRepo);
    const postingAccountsAndEvents =
      await ledgerServiceFn.bootstrapNonPowerUserPostingAccounts(
        accountingEntity,
        {
          correlationId,
        }
      );

    const accounts: ILedgerAccount[] = [];
    const events: IEvent<ILedgerAccount>[] = [];

    for (const [account, events] of postingAccountsAndEvents) {
      accounts.push(account);

      events.push(...events);
    }

    await ledgerAccountRepo.save(accounts, { correlationId });

    eventBus.publish(
      events.map((e) => eventValue.enrich(e, { correlationId }))
    );
  };
}
