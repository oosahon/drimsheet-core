import { IEntityDelta } from '@shared/values/history/types/history.types';

export interface IEvent<T> extends IEventEnrichmentPayload {
  type: string;
  data: T;
  occurredAt: Date;
  enrichedAt: Date | null;
}

export interface IEventEnrichmentPayload {
  correlationId?: string;
  idempotencyKey?: string;
}

export type TEventEnricher<T> = (payload: IEventEnrichmentPayload) => IEvent<T>;

export type TEntityWithEvents<Entity, EventPayload> = [
  Entity,
  IEvent<EventPayload>[],
];

export type TAuditedEntity<Entity, EventPayload, SnapShot extends object> = [
  Entity,
  IEvent<EventPayload>[],
  IEntityDelta<SnapShot>,
];

export type TEventHandler<T> = (event: IEvent<T>) => Promise<void>;
