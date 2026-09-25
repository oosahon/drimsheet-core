import { TEntityId } from '@shared/types/uuid';

import actorEntity from '@domain/user/entities/actor.entity';
import userEntity from '@domain/user/entities/user.entity';
import actorError from '@domain/user/errors/actor.error';

const creator = '123e4567-e89b-42d3-a456-426614174000' as TEntityId;
const [owner] = userEntity.make({
  actorId: creator,
  createdBy: creator,
  email: 'drimsheet-owner/name@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  emailVerified: true,
});

describe('actorEntity', () => {
  it('creates distinct self-attributed migration and human identities', () => {
    const [migration] = actorEntity.makeMigration();
    const [user, events, audit] = actorEntity.makeUser({
      email: ' USER@Example.com ',
      displayName: ' User Name ',
    });
    expect(migration.username).toBe('drimsheet-migration');
    expect(migration.createdBy).toBe(migration.id);
    expect(user.username).toBe('user@example.com');
    expect(user.displayName).toBe('User Name');
    expect(user.createdBy).toBe(user.id);
    expect(user.id).not.toBe(migration.id);
    expect(events[0].data).toBe(user);
    expect(audit.diff.after).toBe(user);
    expect(audit.entityVersion).toBe(1);
    expect(Object.isFrozen(user)).toBe(true);
    expect(Object.isFrozen(events[0])).toBe(true);
    expect(Object.isFrozen(audit.diff)).toBe(true);
    expect(user).not.toHaveProperty('onBehalfOf');
  });

  it('uses the fixed platform names and the supplied performer', () => {
    const [system] = actorEntity.makeSystem(creator);
    const [ai] = actorEntity.makeAgent({ createdBy: creator });
    expect(system.username).toBe('drimsheet-core');
    expect(ai.username).toBe('drimsheet-core-ai');
    expect(system.createdBy).toBe(creator);
    expect(ai.createdBy).toBe(creator);
    expect(ai.ownerActorId).toBeNull();
    expect(ai.agentName).toBeNull();
  });

  it('qualifies a normalized agent name with its owner email and records the independent creator', () => {
    const performer = actorEntity.makeMigration()[0].id;
    const [agent] = actorEntity.makeAgent({
      user: owner,
      name: ' __My   Smart___Agent-- ',
      createdBy: performer,
    });
    expect(agent.username).toBe(
      'drimsheet-owner/name@example.com/my-smart-agent'
    );
    expect(agent.ownerActorId).toBe(owner.actorId);
    expect(agent.createdBy).toBe(performer);
    expect(agent.agentName).toBe('my-smart-agent');
    const [otherOwner] = userEntity.make({
      actorId: performer,
      createdBy: performer,
      email: 'second@example.com',
      firstName: 'Other',
      lastName: 'Owner',
      emailVerified: true,
    });
    expect(
      actorEntity.makeAgent({
        user: otherOwner,
        name: 'my-smart-agent',
        createdBy: performer,
      })[0].username
    ).toBe('second@example.com/my-smart-agent');
    expect(
      actorEntity.makeAgent({
        user: owner,
        name: 'MY_SMART_AGENT',
        createdBy: performer,
      })[0].username
    ).toBe(agent.username);
  });

  it.each(['', '___', 'a/b', 'a@b', 'é', 'a'.repeat(65)])(
    'rejects unsupported or empty agent name %s',
    (name) => {
      expect(() =>
        actorEntity.makeAgent({ user: owner, name, createdBy: creator })
      ).toThrow(actorError.InvalidAgentName);
    }
  );

  it('rejects a missing owned name, invalid supplied user, and platform name overrides', () => {
    expect(() =>
      actorEntity.makeAgent({ user: owner, createdBy: creator })
    ).toThrow(actorError.InvalidAgentName);
    expect(() =>
      actorEntity.makeAgent({
        user: undefined,
        name: 'agent',
        createdBy: creator,
      })
    ).toThrow(actorError.InvalidOwner);
    expect(() =>
      actorEntity.makeAgent({ name: 'agent', createdBy: creator })
    ).toThrow(actorError.InvalidAgentName);
    expect(() => actorEntity.makeSystem('invalid' as TEntityId)).toThrow(
      actorError.InvalidCreatedBy
    );
    expect(() =>
      actorEntity.makeUser({ email: 'valid@example.com', displayName: '' })
    ).toThrow(actorError.InvalidDisplayName);
  });
});
