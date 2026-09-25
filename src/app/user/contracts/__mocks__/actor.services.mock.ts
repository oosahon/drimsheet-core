import IActorService from '@domain/user/types/actor.service.types';
import IUserIdentityService from '@domain/user/types/user-identity.service.types';

export const mockActorService: jest.Mocked<IActorService> = {
  resolveUser: jest.fn(),
  resolveByUsername: jest.fn(),
};

export const mockUserIdentityService: jest.Mocked<IUserIdentityService> = {
  create: jest.fn(),
};
