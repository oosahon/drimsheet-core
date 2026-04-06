export interface IEvent<T> extends IEventEnrichmentPayload {
  type: string;
  data: T;
  occurredAt: Date;
  enrichedAt?: Date;
}

export interface IEventEnrichmentPayload {
  correlationId?: string;
  idempotencyKey?: string;
}

export type TEventEnricher<T> = (payload: IEventEnrichmentPayload) => IEvent<T>;

export interface IEventWithEnricher<T> {
  event: IEvent<T>;
  enricher: TEventEnricher<T>;
}

export type TEntityWithEvents<Entity, EventPayload> = [
  Entity,
  IEventWithEnricher<EventPayload>[],
];

export type TEventHandler<T> = (event: IEvent<T>) => Promise<void>;
