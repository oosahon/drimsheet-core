import { IEvent, TEntityWithEvents } from '../../types/event.types';
import getEntitiesAndEvents from '../get-entities-and-events';

describe('getEntitiesAndEvents', () => {
  type TMockEntity = { id: number; name: string };
  type TMockEventData = TMockEntity;

  const mockEntity1: TMockEntity = { id: 1, name: 'Entity 1' };
  const mockEntity2: TMockEntity = { id: 2, name: 'Entity 2' };

  const mockEvent1: IEvent<TMockEventData> = {
    type: 'domain:mock:event-1',
    data: mockEntity1,
    occurredAt: new Date(),
    enrichedAt: null,
  };

  const mockEvent2: IEvent<TMockEventData> = {
    type: 'domain:mock:event-2',
    data: mockEntity2,
    occurredAt: new Date(),
    enrichedAt: null,
  };

  const mockEvent3: IEvent<TMockEventData> = {
    type: 'domain:mock:event-3',
    data: mockEntity2,
    occurredAt: new Date(),
    enrichedAt: null,
  };

  it('should correctly separate entities and events from the input data', () => {
    const data: TEntityWithEvents<TMockEntity, TMockEventData>[] = [
      [mockEntity1, [mockEvent1]],
      [mockEntity2, [mockEvent2, mockEvent3]],
    ];

    const result = getEntitiesAndEvents(data);

    expect(result.entities).toHaveLength(2);
    expect(result.entities).toEqual([mockEntity1, mockEntity2]);

    expect(result.events).toHaveLength(3);
    expect(result.events).toEqual([mockEvent1, mockEvent2, mockEvent3]);

    expect(Object.isFrozen(result)).toBe(true);
  });

  it('should handle tuples with empty event arrays', () => {
    const data: TEntityWithEvents<TMockEntity, TMockEventData>[] = [
      [mockEntity1, []],
      [mockEntity2, [mockEvent2]],
    ];

    const result = getEntitiesAndEvents(data);

    expect(result.entities).toHaveLength(2);
    expect(result.entities).toEqual([mockEntity1, mockEntity2]);

    expect(result.events).toHaveLength(1);
    expect(result.events).toEqual([mockEvent2]);

    expect(Object.isFrozen(result)).toBe(true);
  });

  it('should return empty arrays when given an empty input array', () => {
    const data: TEntityWithEvents<TMockEntity, TMockEventData>[] = [];

    const result = getEntitiesAndEvents(data);

    expect(result.entities).toHaveLength(0);
    expect(result.entities).toEqual([]);

    expect(result.events).toHaveLength(0);
    expect(result.events).toEqual([]);

    expect(Object.isFrozen(result)).toBe(true);
  });
});
