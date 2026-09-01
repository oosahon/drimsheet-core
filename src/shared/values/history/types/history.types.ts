import { IDiff } from '@shared/types/diff.types';
import { TEntityId } from '@shared/types/uuid';

export const EHistoryActorType = {
  User: 'user',
  System: 'system',
  Migration: 'migration',
} as const;

export type UHistoryActorType =
  (typeof EHistoryActorType)[keyof typeof EHistoryActorType];

export interface IHistoryActor {
  type: UHistoryActorType;
  userId: TEntityId | null;
}

export interface IUserHistoryActor extends IHistoryActor {
  type: typeof EHistoryActorType.User;
  userId: TEntityId;
}

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
  actor: IHistoryActor;
  correlationId: string;
}
