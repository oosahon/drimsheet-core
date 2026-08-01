import { InferSelectModel } from 'drizzle-orm';
import { IVendorHistory } from '../../../../../domain/counterparty/types/counterparty-audit.types';
import { counterpartyVendorHistoryInAudit } from '../../../../config/drizzle/schema';
import { toRepoDate } from '../../../helpers/date.mapper';

export interface IVendorHistoryRepoModel extends InferSelectModel<
  typeof counterpartyVendorHistoryInAudit
> {}

const vendorHistoryMapper = {
  toRepo(
    history: IVendorHistory
  ): Omit<IVendorHistoryRepoModel, 'id' | 'recordedAt'> {
    return {
      counterpartyId: history.entityId,
      actorType: history.actor.type,
      action: history.action,
      userId: history.actor.userId,
      diff: history.diff,
      correlationId: history.correlationId,
      occurredAt: toRepoDate(history.occurredAt),
    };
  },
};

export default vendorHistoryMapper;
