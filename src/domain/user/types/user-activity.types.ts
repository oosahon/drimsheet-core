import { ICorrelationId } from '../../../shared/types/correlation-id.types';
import { TEntityId } from '../../../shared/types/uuid';

interface IUserActivityMeta extends ICorrelationId, Record<string, unknown> {}

export interface IUserActivity {
  id: TEntityId;
  userId: TEntityId;
  eventKey: string;
  description: string;
  meta: IUserActivityMeta | null;
  createdAt: Date;
}
