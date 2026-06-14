import {
  IEvent,
  TAuditedEntity,
  TEntityWithEvents,
} from '../types/event.types';

export default function getEntitiesAndEvents<T, E, S extends object = object>(
  data: (TEntityWithEvents<T, E> | TAuditedEntity<T, E, S>)[]
) {
  const entities: T[] = [];
  const events: IEvent<E>[] = [];

  for (const [entity, event] of data) {
    entities.push(entity);
    events.push(...event);
  }

  return Object.freeze({ entities, events });
}
