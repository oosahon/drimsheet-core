import { IEvent, TEntityWithEvents } from '../types/event.types';

export default function getEntitiesAndEvents<T, E>(
  data: TEntityWithEvents<T, E>[]
) {
  const entities: T[] = [];
  const events: IEvent<E>[] = [];

  for (const [entity, event] of data) {
    entities.push(entity);
    events.push(...event);
  }

  return Object.freeze({ entities, events });
}
