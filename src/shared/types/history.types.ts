import { IDiff } from './diff.types';
import { IEvent } from './event.types';
import { TEntityId } from './uuid';

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

export interface IHistoryRecord<
  TSnapshot extends object,
  TAction extends string,
> {
  id: TEntityId;
  entityId: TEntityId;
  actor: IHistoryActor;
  action: TAction;
  diff: IDiff<TSnapshot>;
  note: string | null;
  occurredAt: Date;
}

export interface IAuditedDomainResult<TEntity, THistory, TEventPayload> {
  entity: TEntity;
  history: THistory;
  events: IEvent<TEventPayload>[];
}

export interface IHistoryWrite<TEntity, THistory> {
  entity: TEntity;
  history: THistory;
}
