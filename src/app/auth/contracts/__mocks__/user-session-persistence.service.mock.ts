import IUserSessionPersistenceService from '@app/auth/contracts/user-session-persistence.service.contract';

const mockUserSessionPersistenceService: jest.Mocked<IUserSessionPersistenceService> =
  {
    replaceClientSession: jest.fn(),
    rotateSession: jest.fn(),
    replaceAllUserSessions: jest.fn(),
  };

export default mockUserSessionPersistenceService;
