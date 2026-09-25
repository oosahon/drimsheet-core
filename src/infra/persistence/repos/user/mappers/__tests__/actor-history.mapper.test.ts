import historyValue from '@shared/values/history/history.vo';

import actorEntity from '@domain/user/entities/actor.entity';

import actorHistoryMapper from '@infra/persistence/repos/user/mappers/actor-history.mapper';

it('keeps the actor entity, performer, and delegation as separate references', () => {
  const [creator] = actorEntity.makeMigration();
  const [represented] = actorEntity.makeUser({
    email: 'user@example.com',
    displayName: 'User',
  });
  const [agent, , audit] = actorEntity.makeAgent({ createdBy: creator.id });
  const history = historyValue.make(
    audit,
    creator.id,
    'actor-history',
    represented.id
  );
  expect(actorHistoryMapper.toRepo(history)).toEqual({
    actorEntityId: agent.id,
    actorId: creator.id,
    onBehalfOf: represented.id,
    action: 'created',
    diff: history.diff,
    correlationId: 'actor-history',
    occurredAt: agent.createdAt.toISOString(),
  });
  expect(history.diff.after).not.toHaveProperty('onBehalfOf');
});
