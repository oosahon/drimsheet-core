import { TEntityId } from '@shared/types/uuid';

import actorEntity from '@domain/user/entities/actor.entity';
import actorValidation from '@domain/user/entities/validations/actor.validation';
import actorError from '@domain/user/errors/actor.error';
import { IActor } from '@domain/user/types/actor.types';
import { IUser } from '@domain/user/types/user.types';

const [actor] = actorEntity.makeMigration();

describe('actorValidation', () => {
  it.each([
    ['id', 'bad', actorError.InvalidId],
    ['createdBy', null, actorError.InvalidCreatedBy],
    ['type', 'alien', actorError.InvalidType],
    ['status', 'lost', actorError.InvalidStatus],
    ['displayName', '', actorError.InvalidDisplayName],
    ['displayName', 'a'.repeat(320), actorError.InvalidDisplayName],
    ['version', 0, actorError.InvalidVersion],
    ['version', 1.5, actorError.InvalidVersion],
    ['createdAt', new Date('bad'), actorError.InvalidDate],
    ['updatedAt', new Date('bad'), actorError.InvalidDate],
    ['username', null, actorError.InvalidUsername],
    ['username', 'a'.repeat(320), actorError.InvalidUsername],
    ['username', 'DRIMSHEET-MIGRATION', actorError.InvalidUsername],
    ['username', 'drimsheet-ai', actorError.InvalidUsername],
    ['ownerActorId', actor.id, actorError.InvalidOwner],
    ['agentName', 'agent', actorError.InvalidOwner],
  ])('rejects invalid %s', (field, value, error) => {
    expect(() =>
      actorValidation.validate({ ...actor, [field as string]: value } as IActor)
    ).toThrow(error);
  });

  it('validates disabled identities for historical reading', () => {
    expect(() =>
      actorValidation.validate({ ...actor, status: 'disabled' })
    ).not.toThrow();
  });

  it('requires valid owner links and a matching qualified agent suffix', () => {
    const agent: IActor = {
      ...actor,
      type: 'ai_agent',
      ownerActorId: actor.id,
      agentName: 'agent',
      username: 'owner/path@example.com/agent',
    };
    expect(() => actorValidation.validate(agent)).not.toThrow();
    expect(() =>
      actorValidation.validate({ ...agent, ownerActorId: 'bad' as TEntityId })
    ).toThrow(actorError.InvalidOwner);
    expect(() =>
      actorValidation.validate({ ...agent, agentName: null })
    ).toThrow(actorError.InvalidAgentName);
    expect(() =>
      actorValidation.validate({
        ...agent,
        username: 'owner@example.com/other',
      })
    ).toThrow(actorError.InvalidUsername);
    expect(() =>
      actorValidation.validate({ ...agent, username: 'agent' })
    ).toThrow(actorError.InvalidUsername);
    expect(() =>
      actorValidation.validateOwner({
        createdBy: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
        actorId: actor.id,
        email: 'owner@example.com',
        deletedAt: new Date(),
      } as IUser)
    ).toThrow(actorError.InvalidOwner);
    expect(() =>
      actorValidation.validateOwner({
        createdBy: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
        actorId: 'bad',
      } as IUser)
    ).toThrow(actorError.InvalidOwner);
  });

  it('accepts the maximum email-qualified name length', () => {
    const email =
      'a'.repeat(64) +
      '@' +
      'b'.repeat(63) +
      '.' +
      'c'.repeat(63) +
      '.' +
      'd'.repeat(61);
    expect(email.length).toBe(254);
    const maxActor: IActor = {
      ...actor,
      type: 'ai_agent',
      ownerActorId: actor.id,
      agentName: 'x'.repeat(64),
      username: email + '/' + 'x'.repeat(64),
    };
    expect(maxActor.username.length).toBe(319);
    expect(() => actorValidation.validate(maxActor)).not.toThrow();
  });
});
