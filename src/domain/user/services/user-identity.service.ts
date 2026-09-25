import actorEntity from '@domain/user/entities/actor.entity';
import userEntity from '@domain/user/entities/user.entity';
import IUserIdentityService from '@domain/user/types/user-identity.service.types';

/** Prepares a self-registered actor and linked user without persistence or publication. */
function makeCreate(): IUserIdentityService['create'] {
  return (payload) => {
    const actorCreation = actorEntity.makeUser({
      email: payload.email,
      displayName: `${payload.firstName} ${payload.lastName}`,
    });
    const [actor] = actorCreation;
    const userCreation = userEntity.make({
      actorId: actor.id,
      createdBy: actor.id,
      email: actor.username,
      emailVerified: payload.emailVerified,
      firstName: payload.firstName,
      lastName: payload.lastName,
    });
    return Object.freeze({ actor: actorCreation, user: userCreation });
  };
}

export default function makeUserIdentityService(): IUserIdentityService {
  return Object.freeze({ create: makeCreate() });
}
