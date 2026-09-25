import userEntity from '@domain/user/entities/user.entity';
import makeUserIdentityService from '@domain/user/services/user-identity.service';

describe('user identity service', () => {
  it('prepares consistent distinct identities and preserves their links through profile transitions', () => {
    const result = makeUserIdentityService().create({
      email: ' ADA@Example.com ',
      firstName: 'Ada',
      lastName: 'Lovelace',
      emailVerified: false,
    });
    const [actor] = result.actor;
    const [user] = result.user;
    expect(user.id).not.toBe(actor.id);
    expect(user.actorId).toBe(actor.id);
    expect(user.email).toBe(actor.username);
    expect(actor.displayName).toBe('Ada Lovelace');
    expect(user.createdBy).toBe(actor.id);
    for (const updated of [
      userEntity.update(user, { firstName: 'Augusta' })[0],
      userEntity.verifyEmail(user)[0],
    ]) {
      expect(updated.actorId).toBe(actor.id);
      expect(updated.createdBy).toBe(actor.id);
    }
    expect(Object.isFrozen(result)).toBe(true);
  });
});
