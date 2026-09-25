import { IDiff } from '@shared/types/diff.types';
import { TEntityId } from '@shared/types/uuid';

export interface IEntityDelta<SnapShot extends object> {
  entityId: TEntityId;
  entityVersion: number;
  action: string;
  diff: IDiff<SnapShot>;
  occurredAt: Date;
}

export interface IHistory<
  SnapShot extends object,
> extends IEntityDelta<SnapShot> {
  actorId: TEntityId;
  onBehalfOf: TEntityId | null;
  correlationId: string;
}
