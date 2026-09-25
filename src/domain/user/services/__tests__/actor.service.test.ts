import {
  IReadRepoOptions,
  ITransactionContext,
} from '@shared/types/repo.types';

import actorEntity from '@domain/user/entities/actor.entity';
import actorError from '@domain/user/errors/actor.error';
import IActorRepo from '@domain/user/repos/actor.repo';
import makeActorService from '@domain/user/services/actor.service';
import makeUserIdentityService from '@domain/user/services/user-identity.service';

const identity = makeUserIdentityService().create({
  email: 'user@example.com',
  firstName: 'Test',
  lastName: 'User',
  emailVerified: true,
});
const [user] = identity.user;
const [actor] = identity.actor;
const repo: jest.Mocked<IActorRepo> = {
  create: jest.fn(),
  findById: jest.fn(),
  findByUsername: jest.fn(),
};
const options: IReadRepoOptions = {
  correlationId: 'actor-resolution',
  tx: {} as ITransactionContext,
};
const service = makeActorService({ actorRepo: repo });

describe('actor service', () => {
  beforeEach(() => jest.resetAllMocks());
  it('resolves the user actor through the caller repository options', async () => {
    repo.findById.mockResolvedValue(actor);
    await expect(service.resolveUser(user, options)).resolves.toBe(actor);
    expect(repo.findById).toHaveBeenCalledWith(user.actorId, options);
  });
  it('normalizes named lookup and returns the persisted identity', async () => {
    const [system] = actorEntity.makeSystem(actor.id);
    repo.findByUsername.mockResolvedValue(system);
    await expect(
      service.resolveByUsername(' DRIMSHEET-CORE ', options)
    ).resolves.toBe(system);
    expect(repo.findByUsername).toHaveBeenCalledWith('drimsheet-core', options);
    expect(repo.create).not.toHaveBeenCalled();
  });
  it.each([null, { ...actor, status: 'disabled' as const }])(
    'rejects missing or disabled identities',
    async (invalidActor) => {
      repo.findById.mockResolvedValue(invalidActor);
      repo.findByUsername.mockResolvedValue(invalidActor);
      const error =
        invalidActor === null ? actorError.NotFound : actorError.Disabled;
      await expect(service.resolveUser(user, options)).rejects.toThrow(error);
      await expect(
        service.resolveByUsername(user.email, options)
      ).rejects.toThrow(error);
    }
  );
  it.each([
    { ...actor, type: 'system' as const },
    { ...actor, id: user.id },
    { ...actor, username: 'other@example.com' },
  ])('rejects an inconsistent user link', async (invalidActor) => {
    repo.findById.mockResolvedValue(invalidActor);
    await expect(service.resolveUser(user, options)).rejects.toThrow(
      actorError.InvalidUserLink
    );
  });
  it('propagates storage failures', async () => {
    const failure = new Error('storage unavailable');
    repo.findById.mockRejectedValue(failure);
    await expect(service.resolveUser(user, options)).rejects.toBe(failure);
  });
});
