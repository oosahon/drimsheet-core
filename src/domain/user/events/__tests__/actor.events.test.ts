import actorEntity from '@domain/user/entities/actor.entity';
import actorEvents from '@domain/user/events/actor.events';

it('emits an immutable actor creation event', () => {
  const [actor] = actorEntity.makeMigration();
  const event = actorEvents.created(actor);
  expect(event.type).toBe('domain:actor:created');
  expect(event.data).toBe(actor);
  expect(Object.isFrozen(event)).toBe(true);
});
