import actorEntity from '@domain/user/entities/actor.entity';

import actorMapper from '@infra/persistence/repos/user/mappers/actor.mapper';

it('round-trips all identity and creator fields without a user-id substitution', () => {
  const [actor] = actorEntity.makeSystem(actorEntity.makeMigration()[0].id);
  const row = actorMapper.toRepo(actor);
  expect(row.id).toBe(actor.id);
  expect(row.createdBy).toBe(actor.createdBy);
  expect(row.createdAt).toBe(actor.createdAt.toISOString());
  expect(actorMapper.toDomain(row)).toEqual(actor);
  expect(Object.isFrozen(actorMapper.toDomain(row))).toBe(true);
});
