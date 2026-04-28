import { accountingEntityEventDescriptions } from '../../../domain/accounting/events/accounting-entity.events';
import { assetAccountEventDescriptions } from '../../../domain/ledger/events/asset-account.events';
import { equityAccountEventDescriptions } from '../../../domain/ledger/events/equity-account.events';
import { expenseAccountEventDescriptions } from '../../../domain/ledger/events/expense-account.events';
import { liabilityAccountEventDescriptions } from '../../../domain/ledger/events/liability-account.events';
import { revenueAccountEventDescriptions } from '../../../domain/ledger/events/revenue-account.events';
import userActivityEntity from '../../../domain/user/entities/user-activity.entity';
import { userEventDescriptions } from '../../../domain/user/events/user.events';
import IUserActivityRepo from '../../../domain/user/repos/user-activity.repo';
import { IEvent } from '../../../shared/types/event.types';
import { TEntityId } from '../../../shared/types/uuid';
import IRequestContext from '../../contracts/app/request-context.contract';

export default function makeSaveUserActivityUseCase(
  requestContext: IRequestContext,
  userActivityRepo: IUserActivityRepo
) {
  return async (userId: TEntityId, event: IEvent<unknown>) => {
    const { correlationId } = requestContext.get();

    const descriptionMaps: Record<string, string> = {
      ...accountingEntityEventDescriptions,
      ...assetAccountEventDescriptions,
      ...equityAccountEventDescriptions,
      ...expenseAccountEventDescriptions,
      ...liabilityAccountEventDescriptions,
      ...revenueAccountEventDescriptions,
      ...userEventDescriptions,
    };

    const description = descriptionMaps[event.type] || '';

    const activity = userActivityEntity.make({
      userId,
      eventKey: event.type,
      description,
      meta: { correlationId },
    });

    await userActivityRepo.save(activity, { correlationId });
  };
}
