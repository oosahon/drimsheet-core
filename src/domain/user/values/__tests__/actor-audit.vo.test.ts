import actorEntity from '@domain/user/entities/actor.entity';
import actorAudit from '@domain/user/values/actor-audit.vo';

it('records actor creation without delegation in the entity snapshot', () => {
  const [actor] = actorEntity.makeMigration();
  const audit = actorAudit.created(actor);
  expect(audit).toEqual({
    entityId: actor.id,
    entityVersion: 1,
    action: 'created',
    diff: { before: null, after: actor },
    occurredAt: actor.createdAt,
  });
  expect(Object.isFrozen(audit)).toBe(true);
  expect(audit.diff.after).not.toHaveProperty('onBehalfOf');
});
